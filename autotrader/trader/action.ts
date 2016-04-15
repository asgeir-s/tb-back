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
      autoTraderData.percentToTrade === 1 ? 0.999 : event.subscription.autoTraderData.percentToTrade
    const bitcoinLastPrice = event.signals[0].price
    const signals: Array<Signal> = _.sort((signal1: Signal, signal2: Signal) => signal1.id - signal2.id, event.signals)

    log.info("New trading signal", {
      "autoTraderData": autoTraderData,
      "percentToTrade": percentToTrade,
      "signals": signals
    })

    return Promise.each(signals, (signal: Signal) => {
      if (autoTraderData.openPosition === signal.signal) {
        log.error("ALERT! Duplicate signal. Should not be possible",
          { "openPosition": autoTraderData.openPosition, "newSignal": signal.signal })
      }
      else {
        if (signal.signal === 0) {
          return inn.closeAllPositions(apiKey, apiSecret)
            // if trade is succesfull; set new position on autoTraderData
            .then(res => {
              log.info("succesfully closed all signals", { "res": res })
              autoTraderData.openPosition = signal.signal
              return res
            })
        }
        else {
          return new Promise<number>((resolve, reject) => {
            // if this is the first trade for this autotrader subscription
            if (autoTraderData.openPosition == null) {
              inn.closeAllPositions(apiKey, apiSecret)
                .then(res => {
                  log.info("This is the first trade for this autotrader subscription: succesfully closed all signals",
                    { "res": res })
                  autoTraderData.openPosition = 0
                  resolve(inn.getTradableBalance(apiKey, apiSecret))
                })
            }
            else {
              resolve(inn.getTradableBalance(apiKey, apiSecret))
            }
          })
            .then(tradableBalance => {
              const tradeAmountBtc = (tradableBalance / bitcoinLastPrice) * percentToTrade
              const positionToOpen = signal.signal === 1 ? "LONG" : "SHORT"

              return inn.openPosition(apiKey, apiSecret, tradeAmountBtc, positionToOpen)
                .catch((e: Error) => e.message.indexOf("Invalid order: not enough tradable balance") > -1,
                (err: Error) =>
                  inn.openPosition(apiKey, apiSecret, tradeAmountBtc * 0.98, positionToOpen))
                .catch((e: Error) => e.message.indexOf("Invalid order: not enough tradable balance") > -1,
                (err: Error) =>
                  inn.openPosition(apiKey, apiSecret, tradeAmountBtc * 0.96, positionToOpen))
                .catch((e: Error) => e.message.indexOf("Invalid order: not enough tradable balance") > -1,
                (err: Error) => {
                  log.exception("Was unable to execute trade (three times).", err)
                  throw err
                })
                // if trade is succesfull; set new position on autoTraderData
                .then(res => {
                  autoTraderData.openPosition = signal.signal
                  log.info("Opend position", {
                    "tradeAmountBtc": tradeAmountBtc,
                    "positionToOpen": positionToOpen,
                    "res": res
                  })
                  return res
                })
            })
        }
      }

    })
      .then((result: any) => {
        return inn.saveAutoTraderData(event.subscription.streamId, event.subscription.expirationTime, autoTraderData)
          .then((res: any) => {

            log.info("Saved new autoTraderData", {
              "autoTraderData": autoTraderData,
              "res": res
            })

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
        log.exception("Some (possibly unknown) error", err)
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