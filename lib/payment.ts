import { Streams, AuthLevel } from "./streams"
import { DynamoDb } from "./aws"
import { Crypto } from "./crypto"
import { Coinbase } from "./coinbase"
import { Stream } from "./typings/stream"




export interface SubscriptionRequest {
  email: string
  streamId: string
  autoTrader?: boolean
  apiKey?: string
  apiSecret?: string
  oldexpirationTime?: number
}

export interface Inject {
  getStream: (streamId: string) => Stream
  //createCheckout: (name, description, price)
}

export module Payment {
  export function getPaymentCode(coinbaseClient: any, documentClient: any, streamsTableName: string,
    cryptPassword: string, subscriptionInfo: SubscriptionRequest, GRID: string) {

    // encrypt SubscriptionRequest
    const encryptedSubscriptionRequest = Crypto.encrypt(cryptPassword, subscriptionInfo)
    // get stream price
    return Streams.getStream(documentClient, streamsTableName, AuthLevel.Public, GRID, subscriptionInfo.streamId)

      // request coinbase for paymentCode
      .then(stream => Coinbase.createCheckout(coinbaseClient, "Stream Subscription",
        stream.subscriptionPriceUSD.toString(), "Subscription to stream: " + stream.name + ", autoTrader: " +
        subscriptionInfo.autoTrader, encryptedSubscriptionRequest)
      )

      // return paymentCode
      .then(checkout => checkout.embed_code)

  }

}