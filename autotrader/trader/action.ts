import * as _ from "ramda"
import * as Promise from "bluebird"

import { Context } from "../../lib/common/typings/aws-lambda"
import { log } from "../../lib/logger"
import { Responds } from "../../lib/common/typings/responds"
import { Signal } from "../../lib/common/typings/signal"

export module Trader {

  export interface Inject {
    openPosition:
    (apiKey: string, apiSecret: string, amountBtc: number, typePosition: string) => Promise<any>
    closeAllPositions: (apiKey: string, apiSecret: string) => Promise<any>
    getTradableBalance: (apiKey: string, apiSecret: string) => Promise<number>
    saveAutoTraderData: (streamId: string, subscriptionExpirationTime: number, newAutoTraderData: any) => Promise<any>
    decryptApiKey: (content: string) => string
  }

  /**
   * 1. gets current position
   * 2. execute new tradeAmount
   * 3. save data about new trade to autoTraderData
   */
  export function action(inn: Inject, event: any, context: Context): Promise<Responds> {

    const apiKey = inn.decryptApiKey(event.subscription.apiKey)
    const apiSecret = inn.decryptApiKey(event.subscription.apiSecret)
    const autoTraderData = event.subscription.autoTraderData
    const percentToTrade =
      event.subscription.autoTraderData.percentToTrade === 1 ? 0.999 : event.subscription.autoTraderData.percentToTrade
    const bitcoinLastPrice = event.signals[0].price
    const signals: Array<Signal> = _.sort((signal1: Signal, signal2: Signal) => signal1.id - signal2.id, event.signals)

    return Promise.each(signals, (signal: Signal) => {
      if (autoTraderData.openPosition === signal.signal) {
        console.log("ALERT! Duplicate signal. Should not be possible")
      }
      else {
        autoTraderData.openPosition = signal.signal
        if (signal.signal === 0) {
          return inn.closeAllPositions(apiKey, apiSecret)
        }
        else {
          return inn.getTradableBalance(apiKey, apiSecret)
            .then(tradableBalance => {
              const tradeAmountBtc = (tradableBalance / bitcoinLastPrice) * percentToTrade

              if (signal.signal === 1) {
                return inn.openPosition(apiKey, apiSecret, tradeAmountBtc, "LONG")
                  .catch((e: Error) => e.message.indexOf("Invalid order: not enough tradable balance") > -1,
                  (err: Error) =>
                    inn.openPosition(apiKey, apiSecret, tradeAmountBtc * 0.98, "LONG"))
                  .catch((e: Error) => e.message.indexOf("Invalid order: not enough tradable balance") > -1,
                  (err: Error) =>
                    inn.openPosition(apiKey, apiSecret, tradeAmountBtc * 0.96, "LONG"))
                  .catch((e: Error) => e.message.indexOf("Invalid order: not enough tradable balance") > -1,
                  (err: Error) => {
                    console.log("Was unable to execute trade (three times). Error: " + JSON.stringify(err.message))
                    throw err
                  })
              }
              else if (signal.signal === -1) {
                return inn.openPosition(apiKey, apiSecret, tradeAmountBtc, "SHORT")
                  .catch((e: Error) => e.message.indexOf("Invalid order: not enough tradable balance") > -1,
                  (err: Error) =>
                    inn.openPosition(apiKey, apiSecret, tradeAmountBtc * 0.98, "SHORT"))
                  .catch((e: Error) => e.message.indexOf("Invalid order: not enough tradable balance") > -1,
                  (err: Error) =>
                    inn.openPosition(apiKey, apiSecret, tradeAmountBtc * 0.96, "SHORT"))
                  .catch((e: Error) => e.message.indexOf("Invalid order: not enough tradable balance") > -1,
                  (err: Error) => {
                    console.log("Was unable to execute trade (three times). Error: " + JSON.stringify(err.message))
                    throw err
                  })
              }
            })

        }
      }

    })
      .then((result: any) => {
        console.log("newAutoTraderData: " + JSON.stringify(autoTraderData))

        return inn.saveAutoTraderData(event.subscription.streamId, event.subscription.expirationTime, autoTraderData)
          .then((res: any) => {
            return {
              GRID: context.awsRequestId,
              data: {
                "saveAutoTraderDataResponds": res,
                "result": result
              },
              success: true
            }
          })
      })
      .catch(err => {
        return {
          GRID: context.awsRequestId,
          data: {
            "error": err.message
          },
          success: false
        }
      })
  }
}