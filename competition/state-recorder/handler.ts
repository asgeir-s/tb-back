import * as _ from "ramda"

import { Context } from "../../lib/common/typings/aws-lambda"
import { StateRecorder } from "./action"
import { DynamoDb, SNS } from "../../lib/common/aws"
import { Streams } from "../../lib/common/streams"
import { handle } from "../../lib/handler"
import { log } from "../../lib/logger"

const inject: StateRecorder.Inject = {
    updateOrAddAttribute: _.curry(DynamoDb.updateAttributes)(DynamoDb.documentClientAsync(process.env.DYNAMO_REGION),
        process.env.AWS_DYNAMO_STREAMTABLE),
    recordeStartTime: 1462104000000
}

export function handler(event: any, context: Context) {
    handle(StateRecorder.action, inject, event.Records, context)
}