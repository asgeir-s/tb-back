import * as test from "tape"
import { DynamoDb, SES, SNS } from "./aws"
import * as _ from "ramda"
import { Streams, AuthLevel } from "./streams"
import * as sinon from "sinon"


test("Streams.getStream:", (ot) => {
  ot.plan(3)

  const databaseCli = DynamoDb.documentClientAsync("us-west-2")
  const timestamp = new Date().getTime()

  ot.test("- should be able to get Public stream info", (t) => {
    t.plan(10)

    Streams.getStream(databaseCli, "streams-staging", AuthLevel.Public,
      "43a2cfb3-6026-4a85-b3ab-2468f7d963aa")
      .then((stream) => {
        t.equal(_.has("lastSignal", stream), false, "should not return auth fields")
        t.equal(_.has("status", stream), false, "should not return auth fields")
        t.equal(_.has("idOfLastSignal", stream), false, "should not return auth fields")
        t.equal(_.has("streamPrivate", stream), false, "should not return private fields")

        t.equal(_.has("currencyPair", stream), true, "should return public fields")
        t.equal(_.has("name", stream), true, "should return public fields")
        t.equal(_.has("stats", stream), true, "should return public fields")
        t.equal(_.has("subscriptionPriceUSD", stream), true, "should return public fields")
        t.equal(_.has("exchange", stream), true, "should return public fields")
        t.equal(_.has("id", stream), true, "should return public fields")
      })
  })

  ot.test("- should be able to get Auth stream info", (t) => {
    t.plan(10)

    Streams.getStream(databaseCli, "streams-staging", AuthLevel.Auth,
      "43a2cfb3-6026-4a85-b3ab-2468f7d963aa")
      .then((stream) => {
        t.equal(_.has("streamPrivate", stream), false, "should not return private fields")

        t.equal(_.has("currencyPair", stream), true, "should return public fields")
        t.equal(_.has("name", stream), true, "should return public fields")
        t.equal(_.has("stats", stream), true, "should return public fields")
        t.equal(_.has("subscriptionPriceUSD", stream), true, "should return public fields")
        t.equal(_.has("exchange", stream), true, "should return public fields")
        t.equal(_.has("id", stream), true, "should return public fields")
        t.equal(_.has("lastSignal", stream), true, "should return auth fields")
        t.equal(_.has("status", stream), true, "should return auth fields")
        t.equal(_.has("idOfLastSignal", stream), true, "should return auth fields")
      })
  })

  ot.test("- should be able to get Private stream info", (t) => {
    t.plan(10)

    Streams.getStream(databaseCli, "streams-staging", AuthLevel.Private,
      "43a2cfb3-6026-4a85-b3ab-2468f7d963aa")
      .then((stream) => {
        t.equal(_.has("streamPrivate", stream), true, "should return private fields")
        t.equal(_.has("currencyPair", stream), true, "should return public fields")
        t.equal(_.has("name", stream), true, "should return public fields")
        t.equal(_.has("stats", stream), true, "should return public fields")
        t.equal(_.has("subscriptionPriceUSD", stream), true, "should return public fields")
        t.equal(_.has("exchange", stream), true, "should return public fields")
        t.equal(_.has("id", stream), true, "should return public fields")
        t.equal(_.has("lastSignal", stream), true, "should return auth fields")
        t.equal(_.has("status", stream), true, "should return auth fields")
        t.equal(_.has("idOfLastSignal", stream), true, "should return auth fields")
      })
  })
})

test("Streams.getAllStremsPublic: - should get back Public stream info", (t) => {
  t.plan(30)

  const databaseCli = DynamoDb.documentClientAsync("us-west-2")
  const timestamp = new Date().getTime()

  Streams.getAllStremsPublic(databaseCli, "streams-staging", AuthLevel.Public)
    .then((streams) => {
      _.take(3, streams).map((stream) => {
        t.equal(_.has("lastSignal", stream), false, "should not return auth fields")
        t.equal(_.has("status", stream), false, "should not return auth fields")
        t.equal(_.has("idOfLastSignal", stream), false, "should not return auth fields")
        t.equal(_.has("streamPrivate", stream), false, "should not return private fields")

        t.equal(_.has("currencyPair", stream), true, "should return public fields")
        t.equal(_.has("name", stream), true, "should return public fields")
        t.equal(_.has("stats", stream), true, "should return public fields")
        t.equal(_.has("subscriptionPriceUSD", stream), true, "should return public fields")
        t.equal(_.has("exchange", stream), true, "should return public fields")
        t.equal(_.has("id", stream), true, "should return public fields")
      }
      )
    })
})