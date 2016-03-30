import * as _ from "ramda"
import * as Promise from "bluebird"

import { DynamoDb, SES } from "../../lib/aws"
import { Context } from "../../lib/typings/aws-lambda"
import { Stream } from "../../lib/typings/stream"
import { ContinueSubscriptionEmail, Inject } from "./action"
import { Subscriptions } from "../../lib/subscriptions"
import { PaymentService } from "../../lib/payment-service"
import { handle } from "../../lib/handler"
import { Streams, AuthLevel } from "../../lib/streams"
import { Coinbase } from "../../lib/coinbase"
import { Crypto } from "../../lib/crypto"


const documentClient = DynamoDb.documentClientAsync(process.env.AWS_DYNAMO_REGION)

const inject: Inject = {
  sendEmail:
  _.curry(SES.send)(SES.sesClientAsync(process.env.AWS_SNS_REGION), process.env.FROM_EMAIL_SUBSCRIPTION_INFO),
  load:
  _.curry(DynamoDb.load)(documentClient, process.env.AWS_STORAGE_TABLE, "tb-backend-ContinueSubscriptionEmail"),
  save:
  _.curry(DynamoDb.save)(documentClient, process.env.AWS_STORAGE_TABLE, "tb-backend-ContinueSubscriptionEmail"),
  getExpieringSubscriptions:
  _.curry(Subscriptions.getExpieringSubscriptions)(documentClient, process.env.AWS_DYNAMO_SUBSCRIPTIONTABLE),
  getStream:
  _.curry(Streams.getStream)(documentClient, process.env.STREAMS_TABLE, AuthLevel.Public),
  encryptSubscriptionInfo:
  _.curry(Crypto.encrypt)(process.env.COINBASE_ENCRYPTION_PASSWORD),
  createCheckout:
  _.curry(Coinbase.createCheckout)(Coinbase.coinbaseClient(process.env.COINBASE_SANDBOX, process.env.COINBASE_APIKEY,
    process.env.COINBASE_APISECRET)),
  autoTraderPrice:
  process.env.AUTOTRADER_PRICE,
  timeNow: () =>
    new Date().getTime()
}

export function handler(event: any, context: Context) {
  handle(ContinueSubscriptionEmail.action, inject, event, context)
}