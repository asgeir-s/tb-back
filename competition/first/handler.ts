import * as _ from 'ramda'
import * as Promise from 'bluebird'

import { Context } from '../../lib/typings/aws-lambda'
import { FirstCompitition, Inject } from './action'
import { EmailTemplete } from '../../lib/email-template'
import { SES, DynamoDb } from '../../lib/aws'
import { SubscriptionUtil } from '../../lib/subscription-util'
import { logger } from '../../lib/logger'
import { Responds } from '../../lib/typings/responds'
import { SignalService } from '../../lib/signal-service'

const endTime = 1457222340000

const inject: Inject = {
  documentClient: DynamoDb.documentClientAsync(process.env.AWS_DYNAMO_REGION),
  streamTableName: process.env.STREAMS_TABLE,
  getSignals: (GRID: string, streamId: string) => _.curry(SignalService.getSignalsBefore)(process.env.SERVICE_SIGNALS,
    process.env.SERVICE_SIGNALS_APIKEY, endTime, GRID, streamId),
  timeNow: () => new Date().getTime()
}

export function handler(event: any, context: Context) {
  FirstCompitition.action(inject, event, context)
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