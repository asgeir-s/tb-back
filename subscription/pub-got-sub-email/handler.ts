import * as _ from "ramda"

import { SES, DynamoDb } from "../../lib/common/aws"
import { Users } from "../../lib/common/users"
import { PubGotSubEmail, Inject } from "./action"
import { Context } from "../../lib/common/typings/aws-lambda"
import { Streams } from "../../lib/common/streams"
import { handle } from "../../lib/handler"


const inject: Inject = {
  sendEmail: _.curry(SES.send)(SES.sesClientAsync(process.env.SNS_REGION),
    process.env.FROM_EMAIL_SUBSCRIPTION_INFO),
  getStream: _.curry(Streams.getStream)(DynamoDb.documentClientAsync(process.env.DYNAMO_REGION),
    process.env.DYNAMO_TABLE_STREAMS, Streams.AuthLevel.Private),
  getUserEmail: _.curry(Users.getUser)(process.env.AUTH0_GET_USER_SECRET, "email"),
  timeNow: () => new Date().getTime(),
  autoTraderPriceUsd: parseFloat(process.env.AUTOTRADER_PRICE)
}

export function handler(event: any, context: Context) {
  handle(PubGotSubEmail.action, inject, event, context)
}