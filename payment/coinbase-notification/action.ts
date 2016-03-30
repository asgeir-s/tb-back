import { Streams, AuthLevel } from "../../lib/streams"
import { DynamoDb } from "../../lib/aws"
import { Crypto, CryptedData } from "../../lib/crypto"
import { Coinbase } from "../../lib/coinbase"
import { Stream } from "../../lib/typings/stream"
import { Context } from "../../lib/typings/aws-lambda"
import { logger } from "../../lib/logger"
import { Responds } from "../../lib/typings/responds"
import { SubscriptionRequest } from "../../lib/typings/subscription-request"
import { Subscription } from "../../lib/typings/subscription"


export interface Inject {
  getStream: (streamId: string) => Promise<Stream>
  decryptSubscriptionInfo: (cryptData: CryptedData) => Promise<SubscriptionRequest>
  addSubscription: (subscription: Subscription) => Promise<any>
  doPayout: (payout: Payout) => Promise<any>
}

export interface Payout {
  type: string // "send" or "transfer"
  to: string
  amount: string
  currency: string
  description?: string
  idem?: string
}

export module CoinbaseNotification {
  export function action(inn: Inject, event: SubscriptionRequest, context: Context): Promise<Responds> {
    const log = logger(context.awsRequestId)
    
  }
}

