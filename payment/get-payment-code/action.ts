import * as Promise from "bluebird"
import * as _ from "ramda"

import { Streams, AuthLevel } from "../../lib/streams"
import { DynamoDb } from "../../lib/aws"
import { Crypto, CryptedData } from "../../lib/crypto"
import { Coinbase } from "../../lib/coinbase"
import { Stream } from "../../lib/typings/stream"
import { Context } from "../../lib/typings/aws-lambda"
import { log } from "../../lib/logger"
import { Responds } from "../../lib/typings/responds"
import { SubscriptionRequest } from "../../lib/typings/subscription-request"


export interface Inject {
  getStream: (streamId: string) => Promise<Stream>
  encryptSubscriptionInfo: (subscriptionInfo: SubscriptionRequest) => Promise<CryptedData>
  encryptApiKey: (content: string) => string
  createCheckout: (name: string, priceUSD: string, description: string, cryptedMetadata: any) => Promise<any>
  autoTraderPrice: number
}

export module GetPaymentCode {
  export function action(inn: Inject, event: SubscriptionRequest, context: Context): Promise<Responds> {

    // todo: encrypt apikey and secret with password
    let subscriptionRequest: SubscriptionRequest = _.clone(event)
    if (subscriptionRequest.autoTrader) {
      subscriptionRequest.apiKey = inn.encryptApiKey(event.apiKey)
      subscriptionRequest.apiSecret = inn.encryptApiKey(event.apiSecret)
    }
    log.log("EVENT (keys encrypted)", "received new event", { "subscriptionRequest": subscriptionRequest })

    return Promise.all([inn.getStream(subscriptionRequest.streamId), inn.encryptSubscriptionInfo(subscriptionRequest)])
      .then(res => {
        const stream = res[0]
        const encryptedSubscriptionInfo = res[1]
        const price = totalPrice(stream.subscriptionPriceUSD, subscriptionRequest.autoTrader,
          inn.autoTraderPrice)

        return inn.createCheckout("Stream Subscription", price.toString(), "Subscription to stream: " +
          stream.name + ", autoTrader: " + subscriptionRequest.autoTrader, encryptedSubscriptionInfo)
      })
      .then(checkout => {
        log.info("checkout from coinbase", checkout)
        return {
          "GRID": context.awsRequestId,
          "success": true,
          "data": {
            "paymentCode": checkout.embed_code
          }
        }
      })
  }

  /**
   * returns price with 8 decimal places (whats excetped by Coinbase)
   */
  function totalPrice(subscriptionPriceUsd: number, autoTrader: boolean, autoTraderPriceUsd: number): string {
    if (autoTrader) {
      return (subscriptionPriceUsd + autoTraderPriceUsd).toFixed(8)
    }
    else {
      return subscriptionPriceUsd.toFixed(8)
    }
  }
}

