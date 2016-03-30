import * as _ from "ramda"
import * as Promise from "bluebird"

import { Context } from "../../lib/typings/aws-lambda"
import { TradeGenerator, Inject } from "./action"
import { DynamoDb, SNS } from "../../lib/aws"
import { Responds } from "../../lib/typings/responds"
import { Subscriptions } from "../../lib/subscriptions"
import { handle } from "../../lib/handler"

const inject: Inject = {
  getSubscriptions: _.curry(Subscriptions.getActiveAutotraderSubscriptions)(DynamoDb.documentClientAsync(
    process.env.AWS_DYNAMO_REGION), process.env.AWS_DYNAMO_SUBSCRIPTIONTABLE),
  snsPublish: _.curry(SNS.publish)(SNS.snsClientAsync(process.env.AWS_SNS_REGION), process.env.SNS_TRADE_TOPIC),
  timeNow: () => new Date().getTime()
}

export function handler(event: any, context: Context) {
  handle(TradeGenerator.action, inject, event, context)
}