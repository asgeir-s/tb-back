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
    getAvalibleBalance: (apiKey: string, apiSecret: string) => Promise<number>
    getOrderStatus: (apiKey: string, apiSecret: string, orderId: string) => Promise<any>
    saveAutoTraderData: (orderId: string, data: any) => Promise<any>
  }

  /**
   * 1. gets current position
   * 2. execute new tradeAmount
   * 3. save data about new trade to autoTraderData
   */
  export function action(inn: Inject, event: any, context: Context): Promise<Responds> {

    const requestedPosition: number = _.maxBy((signal: Signal) => signal.id, event.signals).signal
    const apiKey = event.subscription.apiKey
    const apiSecret = event.subscription.apiSecret
    const autoTraderData = event.subscription.autoTraderData
    const percentToTrade = event.subscription.autoTraderData.percentToTrade

    return inn.getOrderStatus(apiKey, apiSecret, autoTraderData.openOrderId)
      .then(openOrder => {

        if (requestedPosition === 0) {
          // close current position
          return inn.executeMarketOrder(apiKey, apiSecret, "btcUSD", openOrder.executed_amount,
            reverse(autoTraderData.openPosition))
        }
        else {
          return inn.getAvalibleBalance(apiKey, apiSecret)
            .then(avalibeBalance => {

              // else if openPosition is 0 and requested in 1
              if (autoTraderData.openPosition === 0 && requestedPosition === 1) {
                const tradeAmount = avalibeBalance * percentToTrade
                return inn.executeMarketOrder(apiKey, apiSecret, "btcUSD", tradeAmount, 1)
              }

              // else if openPosition is 0 and requested in -1
              else if (autoTraderData.openPosition === 0 && requestedPosition === -1) {
                const tradeAmount = avalibeBalance * percentToTrade
                return inn.executeMarketOrder(apiKey, apiSecret, "btcUSD", tradeAmount, -1)
              }

              else {
                let tradeAmount = (avalibeBalance + openOrder.executed_amount) * percentToTrade
                if (tradeAmount < openOrder.executed_amount) {
                  tradeAmount = openOrder.executed_amount
                }

                // else if openPosition is 1 and requested in -1
                if (autoTraderData.openPosition === 1 && requestedPosition === -1) {
                  return inn.executeMarketOrder(apiKey, apiSecret, "btcUSD", tradeAmount, -1)
                }

                // else if openPosition is -1 and requested in 1
                else if (autoTraderData.openPosition === -1 && requestedPosition === 1) {
                  return inn.executeMarketOrder(apiKey, apiSecret, "btcUSD", tradeAmount, 1)
                }
              }
            })
        }
      })
      .then((newOrder: any) => {

        // update autoTraderData
        let newAutoTraderData = _.clone(autoTraderData)
        newAutoTraderData.openOrderId = newOrder.order_id
        newAutoTraderData.openPosition = requestedPosition
        return inn.saveAutoTraderData(event.subscription.orderId, newAutoTraderData)
          .then((res: any) => {
            return {
              GRID: context.awsRequestId,
              data: {
                "newOrder": newOrder,
                "saveAutoTraderDataResponds": res
              },
              success: true
            }
          })
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