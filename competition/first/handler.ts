import * as _ from "ramda"

import { Context } from "../../lib/common/typings/aws-lambda"
import { FirstCompitition, Inject } from "./action"
import { DynamoDb } from "../../lib/common/aws"
import { Signals } from "../../lib/common/signals"
import { handle } from "../../lib/handler"

const endTime = 1457222340000

const inject: Inject = {
  documentClient: DynamoDb.documentClientAsync(process.env.AWS_DYNAMO_REGION),
  streamTableName: process.env.STREAMS_TABLE,
  getSignals: (GRID: string, streamId: string) => _.curry(Signals.getSignalsBefore)(process.env.SERVICE_SIGNALS,
    process.env.SERVICE_SIGNALS_APIKEY, endTime, GRID, streamId),
  timeNow: () => new Date().getTime()
}

export function handler(event: any, context: Context) {
  handle(FirstCompitition.action, inject, event, context)
}