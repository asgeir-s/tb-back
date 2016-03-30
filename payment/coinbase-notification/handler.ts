import * as _ from "ramda"

import { Coinbase } from "../../lib/coinbase"
import { Crypto } from "../../lib/crypto"
import { DynamoDb } from "../../lib/aws"
import { CoinbaseNotification, Inject } from "./action"
import { Context } from "../../lib/typings/aws-lambda"
import { Streams, AuthLevel } from "../../lib/streams"
import { handle } from "../../lib/handler"
import { Subscriptions } from "../../lib/subscriptions"

const documentClient = DynamoDb.documentClientAsync(process.env.DYNAMO_REGION)

const inject: Inject = {
  getStream: _.curry(Streams.getStream)(documentClient,
    process.env.STREAMS_TABLE, AuthLevel.Private),
  decryptSubscriptionInfo: _.curry(Crypto.decrypt)(process.env.COINBASE_ENCRYPTION_PASSWORD),
  addSubscription: _.curry(Subscriptions.addSubscription)(documentClient, "subscriptions-staging"),

  sendMoney: (payout: Coinbase.Payout) => Promise < any >,
  transferMoney: (payout: Coinbase.Payout) => Promise < any >,
  alert: (message: any) => Promise < any >, // new

  timeNow: () => new Date().getTime(),
  cludaPayoutAccount: process.env.ACCOUNT_FOR_PAYOUTS_TO_CLUDA
}
export function handler(event: any, context: Context) {
  // validate callback

  // compute if valide
  handle(CoinbaseNotification.action, inject, event, context)
}