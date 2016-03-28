import * as _ from 'ramda'
import * as Promise from 'bluebird'

import { DynamoDb, SES } from '../../lib/aws'
import { Context } from '../../lib/typings/aws-lambda'
import { EmailTemplete } from '../../lib/email-template'
import { PaymentService } from '../../lib/payment-service'
import { logger } from '../../lib/logger'
import { Streams } from '../../lib/streams'
import { SignalService } from '../../lib/signal-service'
import { Responds } from '../../lib/typings/responds'

export interface Inject {
  documentClient: any,
  streamTableName: string,
  getSignals: (GRID: string, streamId: string) => Promise<Array<any>>,
  timeNow: () => number,
}

export module FirstCompitition {
  const minimumClosedTrades = 17

  export function action(inn: Inject, event: any, context: Context): Promise<Responds> {
    const log = logger(context.awsRequestId)

    // get streams
    return inn.documentClient.scanAsync({
      TableName: inn.streamTableName,
      FilterExpression: 'numberOfClosedTrades > :closed',
      ProjectionExpression: 'id',
      ExpressionAttributeValues: {
        ':closed': minimumClosedTrades
      }
    })
      .then((res: any) => res.Items)
      .map((stream: { id: string }) => {

        // get signals
        return inn.getSignals(context.awsRequestId, stream.id)
          .then((signalsRAw: Array<any>) => {
            const signals = _.sort((a: any, b: any) => a.id - b.id)(signalsRAw)
            const length = signals.length
            if (signals[length - 1].signal === 0) {
              return {
                GRID: context.awsRequestId,
                success: true,
                message: {
                  'id': stream.id,
                  'value': signals[length - 1].valueInclFee,
                  'numberOfSignalsInPeriod': length + 1
                }
              }


            }
            else if (signals[length - 2].signal === 0) {
              return {
                GRID: context.awsRequestId,
                success: true,
                message: {
                  'id': stream.id,
                  'value': signals[length - 2].valueInclFee,
                  'numberOfSignalsInPeriod': length + 1
                }
              }
            }
            else {
              return {
                GRID: context.awsRequestId,
                success: false,
                message: 'error'
              }
            }
          })
      })
      .then((re: Array<any>) => re.sort((a, b) => b.value - a.value))
  }
}
