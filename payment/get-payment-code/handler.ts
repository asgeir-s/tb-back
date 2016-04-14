import * as _ from "ramda"

import { Coinbase } from "../../lib/coinbase"
import { Crypto } from "../../lib/common/crypto"
import { DynamoDb } from "../../lib/common/aws"
import { GetPaymentCode, Inject } from "./action"
import { Context } from "../../lib/common/typings/aws-lambda"
import { Streams } from "../../lib/common/streams"
import { handle } from "../../lib/handler"

const inject: Inject = {
  getStream: _.curry(Streams.getStream)(DynamoDb.documentClientAsync(process.env.DYNAMO_REGION),
    process.env.STREAMS_TABLE, Streams.AuthLevel.Public),
  encryptSubscriptionInfo: _.curry(Crypto.encrypt)(process.env.COINBASE_ENCRYPTION_PASSWORD),
  createCheckout: _.curry(Coinbase.createCheckout)(Coinbase.coinbaseClient(process.env.COINBASE_SANDBOX,
    process.env.COINBASE_APIKEY, process.env.COINBASE_APISECRET)),
  autoTraderPriceUsd: parseFloat(process.env.AUTOTRADER_PRICE),
  encryptApiKey: _.curry(Crypto.encryptSimple)(process.env.APIKEYS_ENCRYPTION_PASSWORD)
}

export function handler(event: any, context: Context) {
  handle(GetPaymentCode.action, inject, event, context, false)
}