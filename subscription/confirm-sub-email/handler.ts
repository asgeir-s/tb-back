import * as _ from 'ramda'

import { SES } from '../../lib/aws'
import { ConfirmSubscriptionEmail, Inject } from './action'
import { Context } from '../../lib/typings/aws-lambda'
import { Streams, AuthLevel } from '../../lib/streams'


const inject: Inject = {
  sendEmail: _.curry(SES.send)(SES.sesClientAsync(process.env.AWS_SNS_REGION),
    process.env.SUBSCRIPTION_INFO_FROM_EMAIL),
  getStream: _.curry(Streams.getStream)(process.env.SERVICE_STREAMS, process.env.SERVICE_STREAMS_APIKEY,
    AuthLevel.Private),
  timeNow: () => new Date().getTime()
}

export function handler(event: any, context: Context) {
  ConfirmSubscriptionEmail.action(inject, event, context)
    .then((result: any) => context.done(null, result))
    .catch((error: any) => {
      console.error('error [' + context.awsRequestId + '] ' + error)
      return context.done({
        GRID: context.awsRequestId,
        message: 'Internal Server Error',
        success: false
      }, null)
    })
}