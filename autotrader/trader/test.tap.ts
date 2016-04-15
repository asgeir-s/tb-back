import * as test from "tape"
import * as Promise from "bluebird"
import * as sinon from "sinon"
import { Context } from "../../lib/common/typings/aws-lambda"
import { Trader } from "./action"
import { SNS } from "../../lib/common/aws"

test("Trader:", (ot) => {
  ot.plan(5)

  ot.test("- should execute order when position is CLOSED and requested position is LONG", (t) => {
    t.plan(4)

    const openPosition = (apiKey: string, apiSecret: string, amountBtc: number, typePosition: string) => {
      t.equal(amountBtc, (200 / 421.4) * 0.999, "the trade amount to trade in BTC, should equal all the avalible balance - 0.1%")
      t.equal(typePosition, "LONG", "requested position should be LONG(1)")

      return Promise.resolve({
        "order_id": "someId"
      })
    }

    const closeAllPositions = (apiKey: string, apiSecret: string) => {
      return Promise.resolve({
        "order_id": "someId"
      })
    }

    const decryptApiKey = (content: string) => "hei " + content

    const getAvalibleBalanceMoc = (apiKey: string, apiSecret: string) => {
      return Promise.resolve(200)
    }

    const getOrderStatusMoc = (apiKey: string, apiSecret: string, orderId: string) => {
      return Promise.resolve(2)
    }

    const saveAutoTraderData = (streamId: string, subscriptionExpirationTime: number, newAutoTraderData: any) => {
      t.equal(newAutoTraderData.openPosition, 1, "the correct newPosition should be saved to the database")

      return Promise.resolve(2)
    }

    const inn: Trader.Inject = {
      openPosition: openPosition,
      closeAllPositions: closeAllPositions,
      decryptApiKey: decryptApiKey,
      getTradableBalance: getAvalibleBalanceMoc,
      saveAutoTraderData: saveAutoTraderData
    }

    const event = {
      "subscription": {
        "creationTime": 1372826728973902,
        "email": "test@msn.com",
        "expirationTime": 14272792793092,
        "orderId": "dsadsadsa-dsadsadsa-dsadsadsa",
        "paymentBtc": 0.0572,
        "paymentUsd": 3,
        "receiveAddress": "csaduy272g3iyg3jdioeai",
        "refundAddress": "dsafdsfdsafdsfdsfdsafdsa223",
        "renewed": false,
        "streamId": "dsadsads-dsadsad-dsadsa-dasdsadsadsa",
        "transactionId": "dsagjdhsadsad33",
        "autoTrader": true,
        "autoTraderData": {
          "openPosition": 0,
          "percentToTrade": 1
        },
        "apiKey": "RIOGvJyssyU3G8VUeWCsJ0GiQEcFtlgExGp4evpmWKO",
        "apiSecret": "RNTIZmPes2gasomOAllpBIfPasY57fJcAg7I25lUfWh"
      },
      "signals": [
        {
          "timestamp": 1430282639369,
          "price": 421.4,
          "change": 0.03,
          "id": 234,
          "valueInclFee": 1.122,
          "changeInclFee": 0.01,
          "value": 1.2029,
          "signal": 1
        }
      ]
    }

    Trader.action(inn, event, <Context>{ awsRequestId: "test-grid" })
      .then(x => {
        t.equal(x.GRID, "test-grid", "the correct GRID should be returned")
      })
  })


  ot.test("- should execute orders when position is LONG and requested position is SHORT", (t) => {
    t.plan(5)

    const openPosition = (apiKey: string, apiSecret: string, amountBtc: number, typePosition: string) => {
      t.equal(amountBtc, (200 / 421.4) * 0.999, "the trade amount to trade in BTC, should equal all the avalible balance - 0.1%")
      t.equal(typePosition, "SHORT", "requested position should be SHORT(1)")

      return Promise.resolve({
        "order_id": "someId"
      })
    }

    const closeAllPositions = (apiKey: string, apiSecret: string) => {
      t.equal(1, 1, "should closeAllPositions")
      return Promise.resolve({
        "order_id": "someId"
      })
    }

    const decryptApiKey = (content: string) => "hei " + content

    const getAvalibleBalanceMoc = (apiKey: string, apiSecret: string) => {
      return Promise.resolve(200)
    }

    const getOrderStatusMoc = (apiKey: string, apiSecret: string, orderId: string) => {
      return Promise.resolve(2)
    }

    const saveAutoTraderData = (streamId: string, subscriptionExpirationTime: number, newAutoTraderData: any) => {
      t.equal(newAutoTraderData.openPosition, -1, "the correct newPosition should be saved to the database")

      return Promise.resolve(2)
    }

    const inn: Trader.Inject = {
      openPosition: openPosition,
      closeAllPositions: closeAllPositions,
      decryptApiKey: decryptApiKey,
      getTradableBalance: getAvalibleBalanceMoc,
      saveAutoTraderData: saveAutoTraderData
    }

    const event = {
      "subscription": {
        "creationTime": 1372826728973902,
        "email": "test@msn.com",
        "expirationTime": 14272792793092,
        "orderId": "dsadsadsa-dsadsadsa-dsadsadsa",
        "paymentBtc": 0.0572,
        "paymentUsd": 3,
        "receiveAddress": "csaduy272g3iyg3jdioeai",
        "refundAddress": "dsafdsfdsafdsfdsfdsafdsa223",
        "renewed": false,
        "streamId": "dsadsads-dsadsad-dsadsa-dasdsadsadsa",
        "transactionId": "dsagjdhsadsad33",
        "autoTrader": true,
        "autoTraderData": {
          "openPosition": 1,
          "percentToTrade": 1
        },
        "apiKey": "RIOGvJyssyU3G8VUeWCsJ0GiQEcFtlgExGp4evpmWKO",
        "apiSecret": "RNTIZmPes2gasomOAllpBIfPasY57fJcAg7I25lUfWh"
      },
      "signals": [
        {
          "timestamp": 1430282639369,
          "price": 421.4,
          "change": 0.03,
          "id": 233,
          "valueInclFee": 1.122,
          "changeInclFee": 0.01,
          "value": 1.2029,
          "signal": 0
        },
        {
          "timestamp": 1430282639369,
          "price": 421.4,
          "change": 0.03,
          "id": 234,
          "valueInclFee": 1.122,
          "changeInclFee": 0.01,
          "value": 1.2029,
          "signal": -1
        }
      ]
    }

    Trader.action(inn, event, <Context>{ awsRequestId: "test-grid" })
      .then(x => {
        t.equal(x.GRID, "test-grid", "the correct GRID should be returned")
      })
  })

  ot.test("- should execute orders when position is SHORT and requested position is CLOSE", (t) => {
    t.plan(3)

    const openPosition = (apiKey: string, apiSecret: string, amountBtc: number, typePosition: string) => {
      t.equal(1, 2, "should not be called")
      return Promise.resolve({
        "order_id": "someId"
      })
    }

    const closeAllPositions = (apiKey: string, apiSecret: string) => {
      t.equal(1, 1, "should closeAllPositions")
      return Promise.resolve({
        "order_id": "someId"
      })
    }

    const decryptApiKey = (content: string) => "hei " + content

    const getAvalibleBalanceMoc = (apiKey: string, apiSecret: string) => {
      return Promise.resolve(200)
    }

    const getOrderStatusMoc = (apiKey: string, apiSecret: string, orderId: string) => {
      return Promise.resolve(2)
    }

    const saveAutoTraderData = (streamId: string, subscriptionExpirationTime: number, newAutoTraderData: any) => {
      t.equal(newAutoTraderData.openPosition, 0, "the correct newPosition should be saved to the database")

      return Promise.resolve(2)
    }

    const inn: Trader.Inject = {
      openPosition: openPosition,
      closeAllPositions: closeAllPositions,
      decryptApiKey: decryptApiKey,
      getTradableBalance: getAvalibleBalanceMoc,
      saveAutoTraderData: saveAutoTraderData
    }

    const event = {
      "subscription": {
        "creationTime": 1372826728973902,
        "email": "test@msn.com",
        "expirationTime": 14272792793092,
        "orderId": "dsadsadsa-dsadsadsa-dsadsadsa",
        "paymentBtc": 0.0572,
        "paymentUsd": 3,
        "receiveAddress": "csaduy272g3iyg3jdioeai",
        "refundAddress": "dsafdsfdsafdsfdsfdsafdsa223",
        "renewed": false,
        "streamId": "dsadsads-dsadsad-dsadsa-dasdsadsadsa",
        "transactionId": "dsagjdhsadsad33",
        "autoTrader": true,
        "autoTraderData": {
          "openPosition": -1,
          "percentToTrade": 1
        },
        "apiKey": "RIOGvJyssyU3G8VUeWCsJ0GiQEcFtlgExGp4evpmWKO",
        "apiSecret": "RNTIZmPes2gasomOAllpBIfPasY57fJcAg7I25lUfWh"
      },
      "signals": [
        {
          "timestamp": 1430282639369,
          "price": 421.4,
          "change": 0.03,
          "id": 233,
          "valueInclFee": 1.122,
          "changeInclFee": 0.01,
          "value": 1.2029,
          "signal": 0
        }
      ]
    }

    Trader.action(inn, event, <Context>{ awsRequestId: "test-grid" })
      .then(x => {
        t.equal(x.GRID, "test-grid", "the correct GRID should be returned")
      })
  })

  ot.test("- should execute orders when position is SHORT and requested position is LONG", (t) => {
    t.plan(5)

    const openPosition = (apiKey: string, apiSecret: string, amountBtc: number, typePosition: string) => {
      t.equal(amountBtc, (200 / 421.4) * 0.999, "the trade amount to trade in BTC, should equal all the avalible balance - 0.1%")
      t.equal(typePosition, "LONG", "requested position should be LONG(1)")
      return Promise.resolve({
        "order_id": "someId"
      })
    }

    const closeAllPositions = (apiKey: string, apiSecret: string) => {
      t.equal(1, 1, "should closeAllPositions")
      return Promise.resolve({
        "order_id": "someId"
      })
    }

    const decryptApiKey = (content: string) => "hei " + content

    const getAvalibleBalanceMoc = (apiKey: string, apiSecret: string) => {
      return Promise.resolve(200)
    }

    const getOrderStatusMoc = (apiKey: string, apiSecret: string, orderId: string) => {
      return Promise.resolve(2)
    }

    const saveAutoTraderData = (streamId: string, subscriptionExpirationTime: number, newAutoTraderData: any) => {
      t.equal(newAutoTraderData.openPosition, 1, "the correct newPosition should be saved to the database")

      return Promise.resolve(2)
    }

    const inn: Trader.Inject = {
      openPosition: openPosition,
      closeAllPositions: closeAllPositions,
      decryptApiKey: decryptApiKey,
      getTradableBalance: getAvalibleBalanceMoc,
      saveAutoTraderData: saveAutoTraderData
    }

    const event = {
      "subscription": {
        "creationTime": 1372826728973902,
        "email": "test@msn.com",
        "expirationTime": 14272792793092,
        "orderId": "dsadsadsa-dsadsadsa-dsadsadsa",
        "paymentBtc": 0.0572,
        "paymentUsd": 3,
        "receiveAddress": "csaduy272g3iyg3jdioeai",
        "refundAddress": "dsafdsfdsafdsfdsfdsafdsa223",
        "renewed": false,
        "streamId": "dsadsads-dsadsad-dsadsa-dasdsadsadsa",
        "transactionId": "dsagjdhsadsad33",
        "autoTrader": true,
        "autoTraderData": {
          "openPosition": -1,
          "percentToTrade": 1
        },
        "apiKey": "RIOGvJyssyU3G8VUeWCsJ0GiQEcFtlgExGp4evpmWKO",
        "apiSecret": "RNTIZmPes2gasomOAllpBIfPasY57fJcAg7I25lUfWh"
      },
      "signals": [
        {
          "timestamp": 1430282639369,
          "price": 421.4,
          "change": 0.03,
          "id": 233,
          "valueInclFee": 1.122,
          "changeInclFee": 0.01,
          "value": 1.2029,
          "signal": 0
        },
        {
          "timestamp": 1430282639369,
          "price": 421.4,
          "change": 0.03,
          "id": 234,
          "valueInclFee": 1.122,
          "changeInclFee": 0.01,
          "value": 1.2029,
          "signal": 1
        }
      ]
    }

    Trader.action(inn, event, <Context>{ awsRequestId: "test-grid" })
      .then(x => {
        t.equal(x.GRID, "test-grid", "the correct GRID should be returned")
      })
  })
  
  
  ot.test("- if this is the first trad for this subscription; should first CLOSE open positions (if any)", (t) => {
    t.plan(5)

    const openPosition = (apiKey: string, apiSecret: string, amountBtc: number, typePosition: string) => {
      t.equal(amountBtc, (200 / 421.4) * 0.999, "the trade amount to trade in BTC, should equal all the avalible balance - 0.1%")
      t.equal(typePosition, "LONG", "requested position should be LONG(1)")
      return Promise.resolve({
        "order_id": "someId"
      })
    }

    const closeAllPositions = (apiKey: string, apiSecret: string) => {
      t.equal(1, 1, "should closeAllPositions")
      return Promise.resolve({
        "order_id": "someId"
      })
    }

    const decryptApiKey = (content: string) => "hei " + content

    const getAvalibleBalanceMoc = (apiKey: string, apiSecret: string) => {
      return Promise.resolve(200)
    }

    const getOrderStatusMoc = (apiKey: string, apiSecret: string, orderId: string) => {
      return Promise.resolve(2)
    }

    const saveAutoTraderData = (streamId: string, subscriptionExpirationTime: number, newAutoTraderData: any) => {
      t.equal(newAutoTraderData.openPosition, 1, "the correct newPosition should be saved to the database")

      return Promise.resolve(2)
    }

    const inn: Trader.Inject = {
      openPosition: openPosition,
      closeAllPositions: closeAllPositions,
      decryptApiKey: decryptApiKey,
      getTradableBalance: getAvalibleBalanceMoc,
      saveAutoTraderData: saveAutoTraderData
    }

    const event = {
      "subscription": {
        "creationTime": 1372826728973902,
        "email": "test@msn.com",
        "expirationTime": 14272792793092,
        "orderId": "dsadsadsa-dsadsadsa-dsadsadsa",
        "paymentBtc": 0.0572,
        "paymentUsd": 3,
        "receiveAddress": "csaduy272g3iyg3jdioeai",
        "refundAddress": "dsafdsfdsafdsfdsfdsafdsa223",
        "renewed": false,
        "streamId": "dsadsads-dsadsad-dsadsa-dasdsadsadsa",
        "transactionId": "dsagjdhsadsad33",
        "autoTrader": true,
        "autoTraderData": {
          "percentToTrade": 1
        },
        "apiKey": "RIOGvJyssyU3G8VUeWCsJ0GiQEcFtlgExGp4evpmWKO",
        "apiSecret": "RNTIZmPes2gasomOAllpBIfPasY57fJcAg7I25lUfWh"
      },
      "signals": [
        {
          "timestamp": 1430282639369,
          "price": 421.4,
          "change": 0.03,
          "id": 234,
          "valueInclFee": 1.122,
          "changeInclFee": 0.01,
          "value": 1.2029,
          "signal": 1
        }
      ]
    }

    Trader.action(inn, event, <Context>{ awsRequestId: "test-grid" })
      .then(x => {
        t.equal(x.GRID, "test-grid", "the correct GRID should be returned")
      })
  })
})

