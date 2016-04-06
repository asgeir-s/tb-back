import * as test from "tape"
import { DynamoDb, SES, SNS } from "./aws"
import * as _ from "ramda"
import { Streams } from "./streams"
import * as sinon from "sinon"
import { NewStreamRequest } from "../../lib/common/typings/new-stream-request"
import { guid } from "./guid"


test("Streams.getStream:", (ot) => {
  ot.plan(9)

  const DYNAMO_REGION = "us-west-2"

  const databaseCli = DynamoDb.documentClientAsync(DYNAMO_REGION)
  const timestamp = new Date().getTime()
  const streamsTableName = "streams-staging"

  let streamId: string

  ot.test("- should be able to get Public stream info", (t) => {
    t.plan(10)

    Streams.getStream(databaseCli, streamsTableName, Streams.AuthLevel.Public,
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

  ot.test("- BATCH GET", (t) => {
    t.plan(10)

    Streams.getStreams(databaseCli, streamsTableName, Streams.AuthLevel.Public,
      ["43a2cfb3-6026-4a85-b3ab-2468f7d963aa"])
      .then((streamArray) => {
        const stream = streamArray[0]
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

  ot.test("- when stream is not found should return undefined", (t) => {
    t.plan(1)

    Streams.getStream(databaseCli, streamsTableName, Streams.AuthLevel.Public,
      "not-real")
      .then((stream) => {
        t.equal(stream, undefined, "should not return undefined")
      })
  })

  ot.test("- should be able to get Auth stream info", (t) => {
    t.plan(10)

    Streams.getStream(databaseCli, streamsTableName, Streams.AuthLevel.Auth,
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

    Streams.getStream(databaseCli, streamsTableName, Streams.AuthLevel.Private,
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

  ot.test("- should be possible to add a new stream", (t) => {
    t.plan(2)

    const STREAM_SERVICE_URL = "http://tb-staging-streams.elasticbeanstalk.com"
    const STREAM_SERVICE_APIKEY = "secret"
    const streamName = "streamFromTest" + guid()
    const newStreamRequest: NewStreamRequest = {
      "name": streamName,
      "exchange": "bitfinex",
      "currencyPair": "btcUSD",
      "payoutAddress": "1kqHKEYYC8CQPxyV53nCju4Lk2ufpQqA2",
      "subscriptionPriceUSD": 5,
      "userId": "auth0|56b23020f971b162055640c3"
    }

    Streams.addNewStream(STREAM_SERVICE_URL, STREAM_SERVICE_APIKEY, "test-GRID", newStreamRequest)
      .then(newStreamId => {
        streamId = newStreamId
        t.equal(newStreamId.length > 10, true, "should return the new streamId")
      })
      .then(() => {
        Streams.addNewStream(STREAM_SERVICE_URL, STREAM_SERVICE_APIKEY, "test-GRID", newStreamRequest)
          .catch((error: Error) => {
            t.equal(error.message.indexOf("A stream with this name already exists") > -1, true,
              "should not be possible to add a stream with the same name again")
          })
      })
  })

  ot.test("- should get Streams.getAllStremsPublic: ", (t) => {
    t.plan(30)

    Streams.getAllStremsPublic(databaseCli, streamsTableName)
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

  ot.test("- should be possible to getApiKeyId", (t) => {
    t.plan(1)

    Streams.getApiKeyId(databaseCli, streamsTableName, streamId)
      .then(apiKeyId => {
        t.equal(apiKeyId.length > 12, true, "should return a apiKeyId")
      })
  })


  ot.test("- should be possible to update the subscription price", (t) => {
    t.plan(1)

    Streams.updateSubscriptionPrice(databaseCli, streamsTableName, streamId, 4)
      .then(subscriptionPriceUSD => {
        t.equal(subscriptionPriceUSD, 4, "should return the new subscription price")
      })
  })
})