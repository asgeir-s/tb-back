import * as _ from "ramda"

import { Context } from "../../lib/common/typings/aws-lambda"
import { StateRecorder } from "./action"
import { DynamoDb, SNS } from "../../lib/common/aws"
import { Streams } from "../../lib/common/streams"
import { handle } from "../../lib/handler"
import { log } from "../../lib/logger"


const competitionStartTime = 1457222340000
const competitionDynamoTable = ""

const documentClient = DynamoDb.documentClientAsync(process.env.DYNAMO_REGION)

const inject: StateRecorder.Inject = {
  setRecordedData: _.curry(DynamoDb.addItemNoReplace)(documentClient, competitionDynamoTable, "streamId"),
  getRecordedData: _.curry(DynamoDb.getItem)(documentClient, competitionDynamoTable),
  snsUnsubscribe: _.curry(SNS.unsubscribe)(SNS.snsClientAsync(process.env.SNS_REGION))
}

export function handler(event: any, context: Context) {
  const message = JSON.parse(event.Records[0].Sns.Message)
  log.info("SNS message", {
    "message": message,
    "subscriptionTable": process.env.AWS_DYNAMO_SUBSCRIPTIONTABLE
  })

  if (message.signals[0].timestamp >= competitionStartTime) {
    handle(StateRecorder.action, inject, message, context)
  }
  else {
    context.done()
  }
}