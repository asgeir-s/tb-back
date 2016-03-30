import * as _ from "ramda"

import { Coinbase } from "../../lib/coinbase"
import { Crypto } from "../../lib/crypto"
import { DynamoDb, SNS } from "../../lib/aws"
import { CoinbaseNotification, Inject } from "./action"
import { Context } from "../../lib/typings/aws-lambda"
import { Streams, AuthLevel } from "../../lib/streams"
import { handle } from "../../lib/handler"
import { Subscriptions } from "../../lib/subscriptions"

const rangeCheck = require("range_check")
const documentClient = DynamoDb.documentClientAsync(process.env.DYNAMO_REGION)
const coinbaseClient = Coinbase.coinbaseClient(process.env.COINBASE_SANDBOX,
  process.env.COINBASE_APIKEY, process.env.COINBASE_APISECRET)

const inject: Inject = {
  getStream: _.curry(Streams.getStream)(documentClient,
    process.env.STREAMS_TABLE, AuthLevel.Private),
  decryptSubscriptionInfo: _.curry(Crypto.decrypt)(process.env.COINBASE_ENCRYPTION_PASSWORD),
  addSubscription: _.curry(Subscriptions.addSubscription)(documentClient, "subscriptions-staging"),
  sendMoney: _.curry(Coinbase.sendMoney)(coinbaseClient, process.env.COINBASE_ACCOUNT_PRIMARY),
  transferMoney: _.curry(Coinbase.transferMoney)(coinbaseClient, process.env.COINBASE_ACCOUNT_PRIMARY),
  alert: _.curry(SNS.publish)(SNS.snsClientAsync(process.env.SNS_REGION), process.env.SNS_ALERT_TOPIC), // new
  timeNow: () => new Date().getTime(),
  cludaVault: process.env.COINBASE_ACCOUNT_VAULT
}
export function handler(event: any, context: Context) {
  // validate callback
  //if (coinbaseClient.verifyCallback(event, context.clientContext. req.headers['CB-SIGNATURE'])) {
  // Process callback
  //}

  if (event.scuset === process.env.SCUSET && rangeCheck.inRange(event.source,
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