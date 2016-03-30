import * as _ from "ramda"

import { Context } from "../../lib/typings/aws-lambda"
import { NotifyEmail, Inject } from "./action"
import { SES, DynamoDb } from "../../lib/aws"
import { Subscriptions } from "../../lib/subscriptions"
import { handle } from "../../lib/handler"

const inject: Inject = {
  sendEmail: _.curry(SES.send)(SES.sesClientAsync(process.env.AWS_SES_REGION), process.env.FROM_EMAIL_SIGNAL_NOTIFY),
  getActiveSubscriptions: _.curry(Subscriptions.getActiveSubscriptions)(DynamoDb.documentClientAsync(
    process.env.AWS_DYNAMO_REGION), process.env.AWS_DYNAMO_SUBSCRIPTIONTABLE),
  timeNow: () => new Date().getTime()
}

export function handler(event: any, context: Context) {
  handle(NotifyEmail.action, inject, event, context)
}