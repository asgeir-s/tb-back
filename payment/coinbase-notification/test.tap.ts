import * as _ from "ramda"
import * as test from "tape"
import * as Promise from "bluebird"
import * as sinon from "sinon"

import { Context } from "../../lib/common/typings/aws-lambda"
import { CoinbaseNotification, Inject } from "./action"
import { SNS, Lambda } from "../../lib/common/aws"
import { Coinbase } from "../../lib/coinbase"
import { Crypto } from "../../lib/common/crypto"
import { DynamoDb } from "../../lib/common/aws"
import { Streams } from "../../lib/common/streams"
import { Subscriptions } from "../../lib/subscriptions"
import { handle } from "../../lib/handler"

const event = require("./event.json")

const DYNAMO_REGION = "us-west-2"
const STREAMS_TABLE = "streams-staging"
const COINBASE_ENCRYPTION_PASSWORD =
  "passwordpasswordpasswordpasswordpasswordpasswordpasswordpasswordpasswordpasswordpasswordpassword"
const COINBASE_SANDBOX = "true"
const COINBASE_APIKEY = "Z0WPTliIqOaW9lb1"
const COINBASE_APISECRET = "zapgYMztFVblKr3evb2DVHzlkiolBXmT"
const AUTOTRADER_PRICE = "15"
const COINBASE_ACCOUNT_PRIMARY = "5d7213c3-0ea7-5e2c-b8b2-4d4c58a6f316"
const SNS_REGION = "us-west-2"
const SNS_ALERT_TOPIC = "arn:aws:sns:us-west-2:525932482084:alerts-staging"
const COINBASE_ACCOUNT_VAULT = "2d0fc1a2-761f-5af0-8969-f80338a168e0"
const LAMBDA_REGION = "us-west-2"
const LAMBDA_ARN_TRADE_GENERATOR =
  "arn:aws:lambda:us-west-2:525932482084:function:tb-back_autotrader_trade-generator:dev"
const LAMBDA_ARN_NOTIFY_EMAIL =
  "arn:aws:lambda:us-west-2:525932482084:function:tb-back_notify_notify-email:dev"

test("CoinbaseNotification:", (ot) => {
  ot.plan(1)

  ot.test("- should handle the default event", (t) => {
    t.plan(4)

    const rangeCheck = require("range_check")
    const documentClient = DynamoDb.documentClientAsync(DYNAMO_REGION)
    const coinbaseClient = Coinbase.coinbaseClient(COINBASE_SANDBOX,
      COINBASE_APIKEY, COINBASE_APISECRET)
    const snsClient = SNS.snsClientAsync(SNS_REGION)
    const lambdaClient = Lambda.lambdaClientAsync(LAMBDA_REGION)

    const inject: Inject = {
      getStream: _.curry(Streams.getStream)(documentClient,
        STREAMS_TABLE, Streams.AuthLevel.Private),
      decryptSubscriptionInfo: _.curry(Crypto.decrypt)(COINBASE_ENCRYPTION_PASSWORD),
      addSubscription: _.curry(Subscriptions.addSubscription)(documentClient, "subscriptions-staging"),
      sendMoney: _.curry(Coinbase.sendMoney)(coinbaseClient, COINBASE_ACCOUNT_PRIMARY),
      transferMoney: _.curry(Coinbase.transferMoney)(coinbaseClient, COINBASE_ACCOUNT_PRIMARY),
      alert: _.curry(SNS.publish)(snsClient, SNS_ALERT_TOPIC), // new
      timeNow: () => new Date().getTime(),
      cludaVault: COINBASE_ACCOUNT_VAULT,
      snsSubscribeLambda: _.curry(SNS.subscribeLambda)(snsClient, lambdaClient),
      tradeGeneratorLambdaArn: LAMBDA_ARN_TRADE_GENERATOR,
      notifyEmailLambdaArn: LAMBDA_ARN_NOTIFY_EMAIL,
      autoTraderPrice: parseFloat(AUTOTRADER_PRICE),

    }

    handle(CoinbaseNotification.action, inject, event.event, <Context>{
      "awsRequestId": "test-GRID",
      "done": (err: any, res: any) => {
        console.log("retro: " + JSON.stringify(res));

        t.equal(res.GRID, "test-GRID", "should have correct GRID")
        t.equal(res.success, true, "the call should be succesfull")
        t.equal(res.data.cludaPayoutId.length > 15, true, "it should return the cluda payout id")
        t.equal(res.data.publisherPayoutId.length > 15, true, "it should return the publisher payout id")
      }
    })

  })
})