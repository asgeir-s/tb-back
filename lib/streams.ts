import { Stream, Stats, StreamPrivate } from './typings/stream'
import { Signal } from './typings/signal'

import * as Promise from 'bluebird'
import * as request from 'request'
import * as _ from 'ramda'

export enum AuthLevel {
  Public,
  Auth,
  Private
}

const publicAttributes: Array<string> = ['accumulatedLoss', 'accumulatedProfit', 'allTimeValueExcl',
  'allTimeValueIncl', 'buyAndHoldChange', 'currencyPair', 'exchange', 'firstPrice', 'id', 'maxDDMax',
  'maxDDPrevMax', 'maxDDPrevMin', 'maxDrawDown', 'name', 'numberOfClosedTrades', 'numberOfLoosingTrades',
  'numberOfProfitableTrades', 'numberOfSignals', 'subscriptionPriceUSD', 'timeOfFirstSignal']

export module Streams {

  export function getStream(documentClient: any, streamTableName: string, authLevel: AuthLevel, GRID: string,
    streamId: string): Promise<Stream> {
    let attributesToGet: Array<string>

    switch (authLevel) {
      case AuthLevel.Public: {
        attributesToGet = _.clone(publicAttributes)
        break
      }
      case AuthLevel.Auth: {
        attributesToGet = _.concat(publicAttributes, ['timeOfLastSignal', 'status', 'lastSignal', 'idOfLastSignal'])
        break
      }
      case AuthLevel.Private: {
        attributesToGet = _.concat(publicAttributes, ['userId', 'apiKeyId', 'idOfLastSignal',
          'lastSignal', 'payoutAddress', 'status', 'timeOfLastSignal', 'topicArn'])
        break
      }
      default: {
        attributesToGet = _.clone(publicAttributes)
        break
      }
    }

    // get stream from dynamo (select variables from auth level)
    return documentClient.getAsync({
      TableName: streamTableName,
      Key: {
        'id': streamId
      },
      AttributesToGet: attributesToGet
    }).then((responds: any) => json2Stream(authLevel, responds.Item))
  }


  export function getAllStremsPublic(documentClient: any, streamTableName: string, authLevel: AuthLevel,
    GRID: string): Promise<Array<Stream>> {
    return documentClient.scanAsync({
      TableName: streamTableName,
      AttributesToGet: _.clone(publicAttributes)
    })
      .then((responds: any) => responds.Items)
      .map((rawStreamJson: any) => json2Stream(AuthLevel.Public, rawStreamJson))
  }

  const getJsonField: (p: string, obj: {}) => any = _.propOr('')

  function json2Stream(authLevel: AuthLevel, json: any): Stream {
    const stats: Stats = {
      timeOfLastSignal: getJsonField('timeOfLastSignal', json),
      accumulatedLoss: getJsonField('accumulatedLoss', json),
      numberOfProfitableTrades: getJsonField('numberOfProfitableTrades', json),
      numberOfLoosingTrades: getJsonField('numberOfLoosingTrades', json),
      numberOfSignals: getJsonField('numberOfSignals', json),
      allTimeValueExcl: getJsonField('allTimeValueExcl', json),
      maxDrawDown: getJsonField('maxDrawDown', json),
      firstPrice: getJsonField('firstPrice', json),
      buyAndHoldChange: getJsonField('buyAndHoldChange', json),
      accumulatedProfit: getJsonField('accumulatedProfit', json),
      timeOfFirstSignal: getJsonField('timeOfFirstSignal', json),
      allTimeValueIncl: getJsonField('allTimeValueIncl', json),
      numberOfClosedTrades: getJsonField('numberOfClosedTrades', json)
    }

    switch (authLevel) {
      case AuthLevel.Public: {
        return {
          currencyPair: getJsonField('currencyPair', json),
          name: getJsonField('name', json),
          stats: stats,
          subscriptionPriceUSD: getJsonField('subscriptionPriceUSD', json),
          exchange: getJsonField('exchange', json),
          id: getJsonField('id', json)
        }
      }
      case AuthLevel.Auth: {
        const lastSignalRaw = getJsonField('lastSignal', json)

        if (lastSignalRaw === '') {
          return {
            currencyPair: getJsonField('currencyPair', json),
            name: getJsonField('name', json),
            stats: stats,
            subscriptionPriceUSD: getJsonField('subscriptionPriceUSD', json),
            exchange: getJsonField('exchange', json),
            id: getJsonField('id', json),
            idOfLastSignal: getJsonField('idOfLastSignal', json),
            status: getJsonField('status', json)
          }
        }
        else {
          return {
            currencyPair: getJsonField('currencyPair', json),
            name: getJsonField('name', json),
            stats: stats,
            subscriptionPriceUSD: getJsonField('subscriptionPriceUSD', json),
            exchange: getJsonField('exchange', json),
            id: getJsonField('id', json),
            idOfLastSignal: getJsonField('idOfLastSignal', json),
            status: getJsonField('status', json),
            lastSignal: json2Signal(JSON.parse(lastSignalRaw))
          }
        }
      }
      case AuthLevel.Private: {
        const lastSignalRaw = getJsonField('lastSignal', json)
        const streamPrivate: StreamPrivate = {
          apiKeyId: getJsonField('apiKeyId', json),
          topicArn: getJsonField('topicArn', json),
          payoutAddress: getJsonField('payoutAddress', json),
          userId: getJsonField('userId', json)
        }

        if (lastSignalRaw === '') {
          return {
            currencyPair: getJsonField('currencyPair', json),
            name: getJsonField('name', json),
            stats: stats,
            subscriptionPriceUSD: getJsonField('subscriptionPriceUSD', json),
            exchange: getJsonField('exchange', json),
            id: getJsonField('id', json),
            idOfLastSignal: getJsonField('idOfLastSignal', json),
            streamPrivate: streamPrivate,
            status: getJsonField('status', json)
          }
        }
        else {
          return {
            currencyPair: getJsonField('currencyPair', json),
            name: getJsonField('name', json),
            stats: stats,
            subscriptionPriceUSD: getJsonField('subscriptionPriceUSD', json),
            exchange: getJsonField('exchange', json),
            id: getJsonField('id', json),
            idOfLastSignal: getJsonField('idOfLastSignal', json),
            status: getJsonField('status', json),
            streamPrivate: streamPrivate,
            lastSignal: json2Signal(JSON.parse(lastSignalRaw))
          }
        }
      }
      default: {
        return {
          currencyPair: getJsonField('currencyPair', json),
          name: getJsonField('name', json),
          stats: stats,
          subscriptionPriceUSD: getJsonField('subscriptionPriceUSD', json),
          exchange: getJsonField('exchange', json),
          id: getJsonField('id', json)
        }
      }
    }

    function json2Signal(json: any): Signal {
      return {
        timestamp: getJsonField('timestamp', json),
        price: getJsonField('price', json),
        change: getJsonField('change', json),
        id: getJsonField('id', json),
        valueInclFee: getJsonField('valueInclFee', json),
        changeInclFee: getJsonField('changeInclFee', json),
        value: getJsonField('value', json),
        signal: getJsonField('signal', json)
      }
    }

  }
}