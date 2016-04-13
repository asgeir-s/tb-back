import * as _ from "ramda"
import * as Promise from "bluebird"

import { Context } from "../../lib/common/typings/aws-lambda"
import { log } from "../../lib/logger"
import { Responds } from "../../lib/common/typings/responds"
import { Signal } from "../../lib/common/typings/signal"


export module Trader {

  export interface Inject {
    executeMarketOrder:
    (apiKey: string, apiSecret: string, symbol: string, amount: number, position: number) => Promise<any>
    getTradableBalance: (apiKey: string, apiSecret: string) => Promise<number>
    getOrderStatus: (apiKey: string, apiSecret: string, orderId: string) => Promise<any>
    saveAutoTraderData: (streamId: string, subscriptionExpirationTime: number, newAutoTraderData: any) => Promise<any>
  }

  /**
   * 1. gets current position
   * 2. execute new tradeAmount
   * 3. save data about new trade to autoTraderData
   */
  export function action(inn: Inject, event: any, context: Context): Promise<Responds> {

    const requestedPosition: number =
      _.sort((signal1: Signal, signal2: Signal) => signal2.id - signal1.id, event.signals)[0].signal
    const apiKey = event.subscription.apiKey
    const apiSecret = event.subscription.apiSecret
    const autoTraderData = event.subscription.autoTraderData
    const percentToTrade =
      event.subscription.autoTraderData.percentToTrade === 1 ? 0.99 : event.subscription.autoTraderData.percentToTrade
    const bitcoinLastPrice = event.signals[0].price

    console.log("autoTraderData: " + JSON.stringify(autoTraderData))


    const trade = (): Promise<any> => {
      if (autoTraderData.openPosition === 0) {
        return inn.getTradableBalance(apiKey, apiSecret)
          .then(tradableBalance => {


            // else if openPosition is 0 and requested in 1
            if (requestedPosition === 1) {
              const tradeAmountBtc = (tradableBalance / bitcoinLastPrice) * percentToTrade
              return inn.executeMarketOrder(apiKey, apiSecret, "btcUSD", tradeAmountBtc, 1)
            }

            // else if openPosition is 0 and requested in -1
            else if (requestedPosition === -1) {
              const tradeAmountBtc = (tradableBalance / bitcoinLastPrice) * percentToTrade
              return inn.executeMarketOrder(apiKey, apiSecret, "btcUSD", tradeAmountBtc, -1)
            }
          })
      }
      else {
        // cancle active order if any

        return inn.getOrderStatus(apiKey, apiSecret, autoTraderData.openOrderId)
          .then(openOrder => {
            console.log("open order: " + JSON.stringify(openOrder))
            const executedAmountBtc = parseFloat(openOrder.executed_amount)
            if (requestedPosition === 0) {
              // close current position
              return inn.executeMarketOrder(apiKey, apiSecret, "btcUSD", executedAmountBtc,
                reverse(autoTraderData.openPosition))
            }
            else {
              // reversed trade


              // close current position


              // when current position os fully closed
              //    open new position

              return inn.getTradableBalance(apiKey, apiSecret)
                .then(tradableBalance => {

                  console.log("tradableBalance: " + tradableBalance)
                  console.log("executedAmountBtc: " + executedAmountBtc)

                  // executedAmountBtc + any new founds
                  let tradeAmountBtc = tradableBalance > 0 ?
                    ((tradableBalance / bitcoinLastPrice) + (executedAmountBtc * 2)) * percentToTrade :
                    executedAmountBtc * 2

                  if (tradeAmountBtc < executedAmountBtc) {
                    tradeAmountBtc = executedAmountBtc
                  }

                  // else if openPosition is 1 and requested in -1
                  if (autoTraderData.openPosition === 1 && requestedPosition === -1) {
                    return inn.executeMarketOrder(apiKey, apiSecret, "btcUSD", tradeAmountBtc, -1)
                  }

                  // else if openPosition is -1 and requested in 1
                  else if (autoTraderData.openPosition === -1 && requestedPosition === 1) {
                    return inn.executeMarketOrder(apiKey, apiSecret, "btcUSD", tradeAmountBtc, 1)
                  }

                })
            }
          })
      }
    }

    return trade()
      .then((newOrder: any) => {
        console.log("newOrder: " + JSON.stringify(newOrder))


        // update autoTraderData
        let newAutoTraderData = _.clone(autoTraderData)
        newAutoTraderData.openOrderId = newOrder.order_id
        newAutoTraderData.openPosition = requestedPosition

        console.log("newAutoTraderData: " + JSON.stringify(newAutoTraderData))


        return inn.saveAutoTraderData(event.subscription.streamId, event.subscription.expirationTime, newAutoTraderData)
          .then((res: any) => {
            return {
              GRID: context.awsRequestId,
              data: {
                "newOrder": newOrder.order_id,
                "saveAutoTraderDataResponds": res
              },
              success: true
            }
          })
      })
      .catch((e: Error) => e.message.indexOf("Invalid order") > -1, error => {
        return {
          GRID: context.awsRequestId,
          data: {
            "info": "order not executed.",
            "error": error.message
          },
          success: true
        }
      })
  }

  function reverse(position: number): number {
    if (position === 0) {
      return 0
    }
    else if (position === 1) {
      return -1
    }
    else if (position === -1) {
      return 1
    }
  }
}