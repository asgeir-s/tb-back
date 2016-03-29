import * as _ from 'ramda'
import * as Promise from 'bluebird'

import { Context } from '../../lib/typings/aws-lambda'
import { NotifyEmail, Inject } from './action'
import { EmailTemplete } from '../../lib/email-template'
import { SES, DynamoDb } from '../../lib/aws'
import { Subscriptions } from '../../lib/subscriptions'
import { logger } from '../../lib/logger'
import { Responds } from '../../lib/typings/responds';


const inject: Inject = {
  sendEmail: _.curry(SES.send)(SES.sesClientAsync(process.env.AWS_SNS_REGION), process.env.FROM_EMAIL_SIGNAL_NOTIFY),
  getActiveSubscriptions: _.curry(Subscriptions.getActiveSubscriptions)(DynamoDb.documentClientAsync(
    process.env.AWS_DYNAMO_REGION), process.env.AWS_DYNAMO_SUBSCRIPTIONTABLE),
  timeNow: () => new Date().getTime()
}

export function handler(event: any, context: Context) {
  NotifyEmail.action(inject, event, context)
    .then((result: any) => context.done(null, result))
    .catch((error: any) => {
      console.error('error [' + context.awsRequestId + '] ' + error)
      return context.done({
        "GRID": context.awsRequestId,
        "message": "Internal Server Error",
        "success": false
      }, null)
    })
}