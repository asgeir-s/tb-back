import * as _ from 'ramda'
import * as Promise from 'bluebird'

import { DynamoDb, SES } from '../../lib/aws'
import { Context } from '../../lib/typings/aws-lambda'
import { ContinueSubscriptionEmail, Inject } from './action'
import { Subscriptions } from '../../lib/subscriptions'
import { PaymentService } from '../../lib/payment-service'


const documentClient = DynamoDb.documentClientAsync(process.env.AWS_DYNAMO_REGION)

const inn: Inject = {
  sendEmail: _.curry(SES.send)(SES.sesClientAsync(process.env.AWS_SNS_REGION),
    process.env.FROM_EMAIL_SUBSCRIPTION_INFO),
  load: _.curry(DynamoDb.load)(documentClient, process.env.AWS_STORAGE_TABLE,
    'tb-backend-ContinueSubscriptionEmail'),
  save: _.curry(DynamoDb.save)(documentClient, process.env.AWS_STORAGE_TABLE,
    'tb-backend-ContinueSubscriptionEmail'),
  getExpieringSubscriptions: _.curry(Subscriptions.getExpieringSubscriptions)(
    documentClient, process.env.AWS_DYNAMO_SUBSCRIPTIONTABLE),
  getPayemntCode: _.curry(PaymentService.getPaymentCode)(process.env.SERVICE_PAYMENT,
    process.env.SERVICE_PAYMENT_APIKEY),
  timeNow: () => new Date().getTime()
}

export function handler(event: any, context: Context) {
  ContinueSubscriptionEmail.action(inn, event, context)
    .then((result: any) => context.done(null, result))
    .catch((error: any) => {
      console.error('error [' + context.awsRequestId + ']: ' + error)
      return context.done({
        "GRID": context.awsRequestId,
        "message": "Internal Server Error",
        "success": false
      }, null)
    })
}