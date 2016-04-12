import * as _ from "ramda"
import * as Promise from "bluebird"

import { Context } from "../../lib/common/typings/aws-lambda"
import { Trader } from "./action"
import { DynamoDb, SNS } from "../../lib/common/aws"
import { Responds } from "../../lib/common/typings/responds"
import { Subscriptions } from "../../lib/subscriptions"
import { Bitfinex } from "../../lib/bitfinex"
import { handle } from "../../lib/handler"

const inject: Trader.Inject = {
  executeMarketOrder: Bitfinex.executeMarketOrder,
  getAvalibleBalance: Bitfinex.getTradableBalance,
  getOrderStatus: Bitfinex.getOrderStatus,
  saveAutoTraderData: _.curry(Subscriptions.updateAutoTraderData)
    (DynamoDb.documentClientAsync(process.env.AWS_DYNAMO_REGION), process.env.AWS_DYNAMO_SUBSCRIPTIONTABLE)
}

export function handler(event: any, context: Context) {
  handle(Trader.action, inject, event, context)
}