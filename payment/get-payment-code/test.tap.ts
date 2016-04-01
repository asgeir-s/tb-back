import * as _ from "ramda"
import * as test from "tape"
import * as Promise from "bluebird"
import * as sinon from "sinon"

import { Context } from "../../lib/typings/aws-lambda"
import { GetPaymentCode, Inject } from "./action"
import { SNS } from "../../lib/aws"
import { Coinbase } from "../../lib/coinbase"
import { Crypto } from "../../lib/crypto"
import { DynamoDb } from "../../lib/aws"
import { Streams, AuthLevel } from "../../lib/streams"
import { handle } from "../../lib/handler"

const event = require("./event.json")

const DYNAMO_REGION = "us-west-2"
const STREAMS_TABLE = "streams-staging"
const COINBASE_ENCRYPTION_PASSWORD = "test-crypt"
const COINBASE_SANDBOX = "true"
const COINBASE_APIKEY = "Z0WPTliIqOaW9lb1"
const COINBASE_APISECRET = "zapgYMztFVblKr3evb2DVHzlkiolBXmT"
const AUTOTRADER_PRICE = "15"
const APIKEYS_ENCRYPTION_PASSWORD = "test-encypt"


test("GetPaymentCode:", (ot) => {
  ot.plan(3)

  const inject: Inject = {
    getStream: _.curry(Streams.getStream)(DynamoDb.documentClientAsync(DYNAMO_REGION),
      STREAMS_TABLE, AuthLevel.Public),
    encryptSubscriptionInfo: _.curry(Crypto.encrypt)(COINBASE_ENCRYPTION_PASSWORD),
    createCheckout: _.curry(Coinbase.createCheckout)(Coinbase.coinbaseClient(COINBASE_SANDBOX,
      COINBASE_APIKEY, COINBASE_APISECRET)),
    autoTraderPrice: parseFloat(AUTOTRADER_PRICE),
    encryptApiKey: _.curry(Crypto.encryptSimple)(APIKEYS_ENCRYPTION_PASSWORD)
  }

  ot.test("- should handle the default event", (t) => {
    t.plan(3)

    handle(GetPaymentCode.action, inject, event, <Context>{
      "awsRequestId": "test-GRID",
      "done": (err: any, res: any) => {
        t.equal(res.GRID, "test-GRID", "should have correct GRID")
        t.equal(res.success, true, "the call should be succesfull")
        t.equal(res.data.paymentCode.length > 15, true, "it should return the paymentCode")
      }
    }, false)

  })

  ot.test("- should handle subscriptionRequest with autoTrader", (t) => {
    t.plan(3)

    const autoTraderEvent = {
      "email": "sogasg@gmail.com",
      "streamId": "43a2cfb3-6026-4a85-b3ab-2468f7d963aa",
      "autoTrader": true,
      "apiKey": "apiKey-test",
      "apiSecret": "apiSecret-test",
    }

    handle(GetPaymentCode.action, inject, autoTraderEvent, <Context>{
      "awsRequestId": "test-GRID",
      "done": (err: any, res: any) => {
        t.equal(res.GRID, "test-GRID", "should have correct GRID")
        t.equal(res.success, true, "the call should be succesfull")
        t.equal(res.data.paymentCode.length > 15, true, "it should return the paymentCode")
      }
    }, false)

  })

  ot.test("- should handle subscriptionRequest with autoTrader and oldexpirationTime (continued subscription)",
    (t) => {
      t.plan(3)

      const autoTraderEvent = {
        "email": "sogasg@gmail.com",
        "streamId": "43a2cfb3-6026-4a85-b3ab-2468f7d963aa",
        "autoTrader": true,
        "apiKey": "apiKey-test",
        "apiSecret": "apiSecret-test",
        "oldexpirationTime": new Date().getTime(),
        "autoTraderData": {
          "open": "hei",
          "number1": 22
        }
      }

      handle(GetPaymentCode.action, inject, autoTraderEvent, <Context>{
        "awsRequestId": "test-GRID",
        "done": (err: any, res: any) => {
          t.equal(res.GRID, "test-GRID", "should have correct GRID")
          t.equal(res.success, true, "the call should be succesfull")
          t.equal(res.data.paymentCode.length > 15, true, "it should return the paymentCode")
        }
      }, false)

    })
})