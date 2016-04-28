import * as Promise from "bluebird"
import * as request from "request"
import * as _ from "ramda"

import { Stream, Stats, StreamPrivate } from "./typings/stream"
import { Signal } from "./typings/signal"
import { NewStreamRequest } from "../../lib/common/typings/new-stream-request"
import { guid } from "./guid"

const requestAsync = Promise.promisify(request)

export module Streams {

  export enum AuthLevel {
    Public,
    Auth,
    Private
  }

  const publicAttributes: Array<string> = ["accumulatedLoss", "accumulatedProfit", "allTimeValueExcl",
    "allTimeValueIncl", "buyAndHoldChange", "currencyPair", "exchange", "firstPrice", "id", "maxDDMax",
    "maxDDPrevMax", "maxDDPrevMin", "maxDrawDown", "name", "numberOfClosedTrades", "numberOfLoosingTrades",
    "numberOfProfitableTrades", "numberOfSignals", "subscriptionPriceUSD", "timeOfFirstSignal", "timeOfLastSignal",
    "recordedState"]


  export function getStream(documentClient: any, streamTableName: string, authLevel: AuthLevel,
    streamId: string): Promise<Stream> {
    return getStreams(documentClient, streamTableName, authLevel, [streamId])
      .then(streamArray => streamArray[0])
  }

  export function getStreams(documentClient: any, streamTableName: string, authLevel: AuthLevel,
    streamIds: Array<String>): Promise<Array<Stream>> {

    let attributesToGet: Array<string>

    switch (authLevel) {
      case AuthLevel.Public: {
        attributesToGet = _.clone(publicAttributes)
        break
      }
      case AuthLevel.Auth: {
        attributesToGet = _.concat(publicAttributes, ["status", "lastSignal", "idOfLastSignal"])
        break
      }
      case AuthLevel.Private: {
        attributesToGet = _.concat(publicAttributes, ["userId", "apiKeyId", "idOfLastSignal",
          "lastSignal", "payoutAddress", "status", "topicArn"])
        break
      }
      default: {
        attributesToGet = _.clone(publicAttributes)
        break
      }
    }

    let requestItems: any = {}
    requestItems[streamTableName] = {
      "Keys": streamIds.map(id => { return { "id": id } }),
      "AttributesToGet": attributesToGet
    }

    // get stream from dynamo (select variables from auth level)
    return documentClient.batchGetAsync({
      "RequestItems": requestItems
    })
      .then((responds: any) => {
        return responds.Responses[streamTableName]
      })
      .map((streamJson: any) => json2Stream(authLevel, streamJson))
  }


  export function getAllStremsPublic(documentClient: any, streamTableName: string): Promise<Array<Stream>> {
    return documentClient.scanAsync({
      TableName: streamTableName,
      AttributesToGet: _.clone(publicAttributes)
    })
      .then((responds: any) => responds.Items)
      .map((rawStreamJson: any) => json2Stream(AuthLevel.Public, rawStreamJson))
  }

  const getJsonField: (prop: string, objct: {}) => any = _.propOr("")

  function json2Stream(authLevel: AuthLevel, json: any): Stream {
    const stats: Stats = {
      timeOfLastSignal: getJsonField("timeOfLastSignal", json),
      accumulatedLoss: getJsonField("accumulatedLoss", json),
      numberOfProfitableTrades: getJsonField("numberOfProfitableTrades", json),
      numberOfLoosingTrades: getJsonField("numberOfLoosingTrades", json),
      numberOfSignals: getJsonField("numberOfSignals", json),
      allTimeValueExcl: getJsonField("allTimeValueExcl", json),
      maxDrawDown: getJsonField("maxDrawDown", json),
      firstPrice: getJsonField("firstPrice", json),
      buyAndHoldChange: getJsonField("buyAndHoldChange", json),
      accumulatedProfit: getJsonField("accumulatedProfit", json),
      timeOfFirstSignal: getJsonField("timeOfFirstSignal", json),
      allTimeValueIncl: getJsonField("allTimeValueIncl", json),
      numberOfClosedTrades: getJsonField("numberOfClosedTrades", json)
    }

    switch (authLevel) {
      case AuthLevel.Public: {
        return {
          currencyPair: getJsonField("currencyPair", json),
          name: getJsonField("name", json),
          stats: stats,
          subscriptionPriceUSD: getJsonField("subscriptionPriceUSD", json),
          exchange: getJsonField("exchange", json),
          id: getJsonField("id", json),
          recordedState: getJsonField("recordedState", json)
        }
      }
      case AuthLevel.Auth: {
        const lastSignalRaw = getJsonField("lastSignal", json)

        if (lastSignalRaw === "") {
          return {
            currencyPair: getJsonField("currencyPair", json),
            name: getJsonField("name", json),
            stats: stats,
            subscriptionPriceUSD: getJsonField("subscriptionPriceUSD", json),
            exchange: getJsonField("exchange", json),
            id: getJsonField("id", json),
            idOfLastSignal: getJsonField("idOfLastSignal", json),
            status: getJsonField("status", json),
            recordedState: getJsonField("recordedState", json)
          }
        }
        else {
          return {
            currencyPair: getJsonField("currencyPair", json),
            name: getJsonField("name", json),
            stats: stats,
            subscriptionPriceUSD: getJsonField("subscriptionPriceUSD", json),
            exchange: getJsonField("exchange", json),
            id: getJsonField("id", json),
            idOfLastSignal: getJsonField("idOfLastSignal", json),
            status: getJsonField("status", json),
            lastSignal: json2Signal(JSON.parse(lastSignalRaw)),
            recordedState: getJsonField("recordedState", json)
          }
        }
      }
      case AuthLevel.Private: {
        const lastSignalRaw = getJsonField("lastSignal", json)
        const streamPrivate: StreamPrivate = {
          apiKeyId: getJsonField("apiKeyId", json),
          topicArn: getJsonField("topicArn", json),
          payoutAddress: getJsonField("payoutAddress", json),
          userId: getJsonField("userId", json)
        }

        if (lastSignalRaw === "") {
          return {
            currencyPair: getJsonField("currencyPair", json),
            name: getJsonField("name", json),
            stats: stats,
            subscriptionPriceUSD: getJsonField("subscriptionPriceUSD", json),
            exchange: getJsonField("exchange", json),
            id: getJsonField("id", json),
            idOfLastSignal: getJsonField("idOfLastSignal", json),
            streamPrivate: streamPrivate,
            status: getJsonField("status", json),
            recordedState: getJsonField("recordedState", json)
          }
        }
        else {
          return {
            currencyPair: getJsonField("currencyPair", json),
            name: getJsonField("name", json),
            stats: stats,
            subscriptionPriceUSD: getJsonField("subscriptionPriceUSD", json),
            exchange: getJsonField("exchange", json),
            id: getJsonField("id", json),
            idOfLastSignal: getJsonField("idOfLastSignal", json),
            status: getJsonField("status", json),
            streamPrivate: streamPrivate,
            lastSignal: json2Signal(JSON.parse(lastSignalRaw)),
            recordedState: getJsonField("recordedState", json)
          }
        }
      }
      default: {
        return {
          currencyPair: getJsonField("currencyPair", json),
          name: getJsonField("name", json),
          stats: stats,
          subscriptionPriceUSD: getJsonField("subscriptionPriceUSD", json),
          exchange: getJsonField("exchange", json),
          id: getJsonField("id", json),
          recordedState: getJsonField("recordedState", json)
        }
      }
    }

    function json2Signal(json: any): Signal {
      return {
        timestamp: getJsonField("timestamp", json),
        price: getJsonField("price", json),
        change: getJsonField("change", json),
        id: getJsonField("id", json),
        valueInclFee: getJsonField("valueInclFee", json),
        changeInclFee: getJsonField("changeInclFee", json),
        value: getJsonField("value", json),
        signal: getJsonField("signal", json)
      }
    }
  }

  export function getApiKeyId(documentClient: any, streamTableName: string, streamId: string): Promise<string> {
    const apiKeyId = guid()
    return documentClient.updateAsync({
      "Key": { "id": streamId },
      "TableName": streamTableName,
      "AttributeUpdates": {
        "apiKeyId": {
          "Action": "PUT",
          "Value": apiKeyId
        }
      },
      "ReturnValues": "UPDATED_NEW"
    }).then((res: any) => res.Attributes.apiKeyId)
  }

  /**
   * returns the updated subscriptionPriceUSD
   */
  export function updateSubscriptionPrice(documentClient: any, streamTableName: string, streamId: string,
    newSubscriptionPrice: number): Promise<number> {
    return documentClient.updateAsync({
      "Key": { "id": streamId },
      "TableName": streamTableName,
      "AttributeUpdates": {
        "subscriptionPriceUSD": {
          "Action": "PUT",
          "Value": newSubscriptionPrice
        }
      },
      "ReturnValues": "UPDATED_NEW"
    }).then((res: any) => res.Attributes.subscriptionPriceUSD)
  }

  // legacy:

  /**
   * returns the new streamId
   */
  export function addNewStream(streamServiceUrl: string, streamServiceApiKey: string, GRID: string,
    newStreamRequest: NewStreamRequest): Promise<string> {
    return requestAsync({
      method: "POST",
      uri: streamServiceUrl + "/streams",
      headers: {
        "Global-Request-ID": GRID,
        "content-type": "application/json",
        "Authorization": "apikey " + streamServiceApiKey
      },
      body: newStreamRequest,
      json: true
    })
      .then((res: any) => {
        if (res.statusCode === 409) {
          throw new Error("A stream with this name already exists.")
        }
        else if (res.statusCode < 200 || res.statusCode >= 300) {
          throw new Error(JSON.stringify(res))
        }
        else {
          return res.body.id
        }
      })
  }
}