/*
import * as test from "tape"
import * as Promise from "bluebird"
import * as sinon from "sinon"
import { Context } from "../../lib/common/typings/aws-lambda"
import { Trader } from "./action"
import { SNS } from "../../lib/common/aws"

test("Trader:", (ot) => {
  ot.plan(5)

  ot.test("- should execute order when position is CLOSED and requested position is LONG", (t) => {
    t.plan(5)

    const executeMarketOrderMoc = (apiKey: string, apiSecret: string, symbol: string, amount: number,
      position: number) => {

      t.equal(amount, 200, "the trade amount, should equal all the avalible balance")
      t.equal(position, 1, "requested position should be LONG(1)")

      return Promise.resolve({
        "order_id": "someId"
      })
    }

    const getAvalibleBalanceMoc = (apiKey: string, apiSecret: string) => {
      return Promise.resolve(200)
    }

    const getOrderStatusMoc = (apiKey: string, apiSecret: string, orderId: string) => {
      return Promise.resolve(2)
    }

    const saveAutoTraderData = (streamId: string, subscriptionExpirationTime: number, newAutoTraderData: any) => {
      t.equal(newAutoTraderData.openOrderId, "someId", "the correct orderId should be saved to the database")
      t.equal(newAutoTraderData.openPosition, 1, "the correct newPosition should be saved to the database")

      return Promise.resolve(2)
    }

    const inn: Trader.Inject = {
      executeMarketOrder: executeMarketOrderMoc,
      getTradableBalance: getAvalibleBalanceMoc,
      getOrderStatus: getOrderStatusMoc,
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
          "openOrderId": "none",
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
        t.equal(x.data.newOrder, "someId", "the correct orderId should be returned")
      })
  })

  ot.test("- should execute order when position is LONG and requested position is CLOSE", (t) => {
    t.plan(5)

    const executeMarketOrderMoc = (apiKey: string, apiSecret: string, symbol: string, amount: number,
      position: number) => {

      t.equal(amount, 333, "the trade amount, should equal the open position")
      t.equal(position, -1, "requested position should be oposite to the current position")

      return Promise.resolve({
        "order_id": "someId"
      })
    }

    const getAvalibleBalanceMoc = (apiKey: string, apiSecret: string) => {
      return Promise.resolve(0)
    }

    const getOrderStatusMoc = (apiKey: string, apiSecret: string, orderId: string) => {
      return Promise.resolve({ "executed_amount": 333 })
    }

    const saveAutoTraderData = (streamId: string, subscriptionExpirationTime: number, newAutoTraderData: any) => {
      t.equal(newAutoTraderData.openOrderId, "someId", "the correct orderId should be saved to the database")
      t.equal(newAutoTraderData.openPosition, 0, "the correct newPosition should be saved to the database")

      return Promise.resolve(2)
    }

    const inn: Trader.Inject = {
      executeMarketOrder: executeMarketOrderMoc,
      getTradableBalance: getAvalibleBalanceMoc,
      getOrderStatus: getOrderStatusMoc,
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
          "openOrderId": "none",
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
          "id": 24,
          "valueInclFee": 1.122,
          "changeInclFee": 0.01,
          "value": 1.2029,
          "signal": 0
        }
      ]
    }

    Trader.action(inn, event, <Context>{ awsRequestId: "test-grid" })
      .then(x => {
        t.equal(x.data.newOrder, "someId", "the correct orderId should be returned")
      })
  })

  ot.test("- should execute order when position is LONG and requested position is SHORT", (t) => {
    t.plan(5)

    const executeMarketOrderMoc = (apiKey: string, apiSecret: string, symbol: string, amount: number,
      position: number) => {

      t.equal(amount, 350, "the trade amount, should equal the open position")
      t.equal(position, -1, "requested position should be oposite to the current position")

      return Promise.resolve({
        "order_id": "someId"
      })
    }

    const getAvalibleBalanceMoc = (apiKey: string, apiSecret: string) => {
      return Promise.resolve(50)
    }

    const getOrderStatusMoc = (apiKey: string, apiSecret: string, orderId: string) => {
      return Promise.resolve({ "executed_amount": 300 })
    }

    const saveAutoTraderData = (streamId: string, subscriptionExpirationTime: number, newAutoTraderData: any) => {
      t.equal(newAutoTraderData.openOrderId, "someId", "the correct orderId should be saved to the database")
      t.equal(newAutoTraderData.openPosition, -1, "the correct newPosition should be saved to the database")

      return Promise.resolve(2)
    }

    const inn: Trader.Inject = {
      executeMarketOrder: executeMarketOrderMoc,
      getTradableBalance: getAvalibleBalanceMoc,
      getOrderStatus: getOrderStatusMoc,
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
          "openOrderId": "none",
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
          "id": 24,
          "valueInclFee": 1.122,
          "changeInclFee": 0.01,
          "value": 1.2029,
          "signal": -1
        },
        {
          "timestamp": 1430282639369,
          "price": 421.4,
          "change": 0.03,
          "id": 23,
          "valueInclFee": 1.122,
          "changeInclFee": 0.01,
          "value": 1.2029,
          "signal": 0
        }
      ]
    }

    Trader.action(inn, event, <Context>{ awsRequestId: "test-grid" })
      .then(x => {
        t.equal(x.data.newOrder, "someId", "the correct orderId should be returned")
      })
  })

  ot.test("- should execute order when position is SHORT and requested position is LONG", (t) => {
    t.plan(5)

    const executeMarketOrderMoc = (apiKey: string, apiSecret: string, symbol: string, amount: number,
      position: number) => {

      t.equal(amount, 160, "the trade amount, should equal the open position")
      t.equal(position, 1, "requested position should be oposite to the current position")

      return Promise.resolve({
        "order_id": "someId"
      })
    }

    const getAvalibleBalanceMoc = (apiKey: string, apiSecret: string) => {
      return Promise.resolve(60)
    }

    const getOrderStatusMoc = (apiKey: string, apiSecret: string, orderId: string) => {
      return Promise.resolve({ "executed_amount": 100 })
    }

    const saveAutoTraderData = (streamId: string, subscriptionExpirationTime: number, newAutoTraderData: any) => {
      t.equal(newAutoTraderData.openOrderId, "someId", "the correct orderId should be saved to the database")
      t.equal(newAutoTraderData.openPosition, 1, "the correct newPosition should be saved to the database")

      return Promise.resolve(2)
    }

    const inn: Trader.Inject = {
      executeMarketOrder: executeMarketOrderMoc,
      getTradableBalance: getAvalibleBalanceMoc,
      getOrderStatus: getOrderStatusMoc,
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
          "openOrderId": "none",
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
          "id": 24,
          "valueInclFee": 1.122,
          "changeInclFee": 0.01,
          "value": 1.2029,
          "signal": 1
        },
        {
          "timestamp": 1430282639369,
          "price": 421.4,
          "change": 0.03,
          "id": 23,
          "valueInclFee": 1.122,
          "changeInclFee": 0.01,
          "value": 1.2029,
          "signal": 0
        }
      ]
    }

    Trader.action(inn, event, <Context>{ awsRequestId: "test-grid" })
      .then(x => {
        t.equal(x.data.newOrder, "someId", "the correct orderId should be returned")
      })
  })

  ot.test("- should only trade with the specifyed percentage", (t) => {
    t.plan(5)

    const executeMarketOrderMoc = (apiKey: string, apiSecret: string, symbol: string, amount: number,
      position: number) => {

      t.equal(amount, 100, "the trade amount, should 50% of the avalible balance")
      t.equal(position, 1, "requested position should be LONG(1)")

      return Promise.resolve({
        "order_id": "someId"
      })
    }

    const getAvalibleBalanceMoc = (apiKey: string, apiSecret: string) => {
      return Promise.resolve(200)
    }

    const getOrderStatusMoc = (apiKey: string, apiSecret: string, orderId: string) => {
      return Promise.resolve(2)
    }

    const saveAutoTraderData = (streamId: string, subscriptionExpirationTime: number, newAutoTraderData: any) => {
      t.equal(newAutoTraderData.openOrderId, "someId", "the correct orderId should be saved to the database")
      t.equal(newAutoTraderData.openPosition, 1, "the correct newPosition should be saved to the database")

      return Promise.resolve(2)
    }

    const inn: Trader.Inject = {
      executeMarketOrder: executeMarketOrderMoc,
      getTradableBalance: getAvalibleBalanceMoc,
      getOrderStatus: getOrderStatusMoc,
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
          "openOrderId": "none",
          "openPosition": 0,
          "percentToTrade": 0.5
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
        t.equal(x.data.newOrder, "someId", "the correct orderId should be returned")
      })
  })
})

*/