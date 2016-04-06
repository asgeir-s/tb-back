import { Streams } from "./common/streams"
import { DynamoDb } from "./common/aws"
import { Crypto } from "./common/crypto"
import { Coinbase } from "./coinbase"
import { Stream } from "./common/typings/stream"
import { SubscriptionRequest } from "./common/typings/subscription-request"


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
    return Streams.getStream(documentClient, streamsTableName, Streams.AuthLevel.Public, subscriptionInfo.streamId)

      // request coinbase for paymentCode
      .then(stream => Coinbase.createCheckout(coinbaseClient, "Stream Subscription",
        stream.subscriptionPriceUSD.toString(), "Subscription to stream: " + stream.name + ", autoTrader: " +
        subscriptionInfo.autoTrader, encryptedSubscriptionRequest)
      )

      // return paymentCode
      .then(checkout => checkout.embed_code)

  }

}