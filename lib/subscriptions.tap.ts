import * as test from "tape"
import { DynamoDb } from "./aws"
import * as _ from "ramda"
import { Streams, AuthLevel } from "./streams"
import { Subscriptions } from "./subscriptions"
import { Subscription } from "./typings/subscription"
import * as sinon from "sinon"

test("Subscriptions - .addSubscription/.getActiveAutotraderSubscriptions/.getActiveSubscriptions/" +
  ".getExpieringSubscriptions: - should be possible to add and get back subscriptions", (t) => {
    t.plan(3)

    const databaseCli = DynamoDb.documentClientAsync("us-west-2")
    const timestamp = new Date().getTime()
    const streamId = "example-test-stream-id-2"
    const expirationTime = timestamp + 100000

    const subscription: Subscription = {
      "creationTime": timestamp,
      "email": "sogasg@gmail.com",
      "expirationTime": expirationTime,
      "orderId": timestamp + "orderId",
      "paymentBTC": 1,
      "paymentUSD": 1000,
      "receiveAddress": "receiveAddress",
      "refundAddress": "refundAddress",
      "renewed": false,
      "streamId": streamId,
      "transactionId": "transactionId",
      "autoTrader": true,
      "autoTraderData": {
        "field1": 234,
        "filed2": "hei"
      },
      "apiKey": "apiKey",
      "apiSecret": "apiSecret"
    }

    Subscriptions.addSubscription(databaseCli, "subscriptions-staging", subscription)
      .then(res => {
        Subscriptions.getActiveAutotraderSubscriptions(databaseCli, "subscriptions-staging", streamId, timestamp)
          .then((res: Array<Subscription>) => {
            t.equal(_.filter((sub: Subscription) => sub.expirationTime === expirationTime, res).length, 1,
              "should contain the reacintly added subscription (.getActiveAutotraderSubscriptions)")
          })
      })
      .then(res => {
        Subscriptions.getActiveSubscriptions(databaseCli, "subscriptions-staging", streamId, timestamp)
          .then((res: Array<Subscription>) => {
            t.equal(_.filter((sub: Subscription) => sub.expirationTime === expirationTime, res).length, 1,
              "should contain the reacintly added subscription (.getActiveSubscriptions)")
          })
      })
      .then(res => {
        Subscriptions.getExpieringSubscriptions(databaseCli, "subscriptions-staging", expirationTime - 10000,
          expirationTime + 10000)
          .then((res: Array<Subscription>) => {
            t.equal(_.filter((sub: Subscription) => sub.expirationTime === expirationTime, res).length, 1,
              "should contain the reacintly added subscription (.getActiveSubscriptions)")
          })
      })
  })