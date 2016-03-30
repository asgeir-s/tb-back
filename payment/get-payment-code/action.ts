import { Streams, AuthLevel } from "../../lib/streams"
import { DynamoDb } from "../../lib/aws"
import { Crypto, CryptedData } from "../../lib/crypto"
import { Coinbase } from "../../lib/coinbase"
import { Stream } from "../../lib/typings/stream"
import { Context } from "../../lib/typings/aws-lambda"
import { logger } from "../../lib/logger"
import { Responds } from "../../lib/typings/responds"
import { SubscriptionRequest } from "../../lib/typings/subscription-request"


export interface Inject {
  getStream: (streamId: string) => Promise<Stream>
  encryptSubscriptionInfo: (subscriptionInfo: SubscriptionRequest) => Promise<CryptedData>
  createCheckout: (name: string, priceUSD: string, description: string, cryptedMetadata: any) => Promise<any>
  autoTraderPrice: number
}

export module GetPaymentCode {
  export function action(inn: Inject, event: SubscriptionRequest, context: Context): Promise<Responds> {
    const log = logger(context.awsRequestId)

    // todo: encrypt apikey and secret with password

    return Promise.all([inn.getStream(event.streamId), inn.encryptSubscriptionInfo(event)])
      .then(res => {
        const stream = res[0]
        const encryptedSubscriptionInfo = res[1]

        let price = stream.subscriptionPriceUSD
        if (event.autoTrader === "true") { price += inn.autoTraderPrice }

        log.info("stream: " + stream.id + ", price: " + price)

        return inn.createCheckout("Stream Subscription", price.toString(), "Subscription to stream: " +
          stream.name + ", autoTrader: " + event.autoTrader, encryptedSubscriptionInfo)
      })
      .then(checkout => {
        log.info("checkout: " + JSON.stringify(checkout))
        return {
          "GRID": context.awsRequestId,
          "success": true,
          "data": {
            "paymentCode": checkout.embed_code
          }
        }
      })
  }
}

