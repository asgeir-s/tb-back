import * as _ from "ramda"

import { Coinbase } from "../../lib/coinbase"
import { Crypto } from "../../lib/common/crypto"
import { DynamoDb, SNS, Lambda } from "../../lib/common/aws"
import { CoinbaseNotification, Inject } from "./action"
import { Context } from "../../lib/common/typings/aws-lambda"
import { Streams } from "../../lib/common/streams"
import { handle } from "../../lib/handler"
import { Subscriptions } from "../../lib/subscriptions"

const rangeCheck = require("range_check")
const documentClient = DynamoDb.documentClientAsync(process.env.DYNAMO_REGION)
const coinbaseClient = Coinbase.coinbaseClient(process.env.COINBASE_SANDBOX,
  process.env.COINBASE_APIKEY, process.env.COINBASE_APISECRET)
const snsClient = SNS.snsClientAsync(process.env.SNS_REGION)
const lambdaClient = Lambda.lambdaClientAsync(process.env.LAMBDA_REGION)

const inject: Inject = {
  getStream: _.curry(Streams.getStream)(documentClient,
    process.env.DYNAMO_STREAMS_TABLE, Streams.AuthLevel.Private),
  decryptSubscriptionInfo: _.curry(Crypto.decrypt)(process.env.COINBASE_ENCRYPTION_PASSWORD),
  addSubscription: _.curry(Subscriptions.addSubscription)(documentClient, process.env.DYNAMO_SUBSCRIPTION_TABLE),
  sendMoney: _.curry(Coinbase.sendMoney)(coinbaseClient, process.env.COINBASE_ACCOUNT_PRIMARY),
  transferMoney: _.curry(Coinbase.transferMoney)(coinbaseClient, process.env.COINBASE_ACCOUNT_PRIMARY),
  alert: _.curry(SNS.publish)(snsClient, process.env.SNS_ALERT_TOPIC), // new
  timeNow: () => new Date().getTime(),
  cludaVault: process.env.COINBASE_ACCOUNT_VAULT,
  snsSubscribeLambda: _.curry(SNS.subscribeLambda)(snsClient, lambdaClient),
  tradeGeneratorLambdaArn: process.env.LAMBDA_ARN_TRADE_GENERATOR,
  notifyEmailLambdaArn: process.env.LAMBDA_ARN_NOTIFY_EMAIL
}

export function handler(event: any, context: Context) {
  // validate callback
  //if (coinbaseClient.verifyCallback(event, context.clientContext. req.headers['CB-SIGNATURE'])) {
  // Process callback
  //}

  const source = (<string>event.source).split(/\s*,\s*/)[0]

  if (event.scuset === process.env.SCUSET && rangeCheck.inRange(source,
    process.env.COINBASE_NOTIFICATION_IP_RANGE)) {
    console.info("AUTORIZED")
    handle(CoinbaseNotification.action, inject, event.event, context)
  }
  else {
    console.error("UNAUTORIZED")
    console.error("request: " + JSON.stringify(event))
    context.fail("UNAUTORIZED")
  }
}