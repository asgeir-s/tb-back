import * as _ from 'ramda'
import * as Promise from 'bluebird'

import { DynamoDb, SES } from '../../lib/aws'
import { Context } from '../../lib/typings/aws-lambda'
import { EmailTemplete } from '../../lib/email-template'
import { PaymentService } from '../../lib/payment-service'
import { logger } from '../../lib/logger'
import { StreamService } from '../../lib/stream-service'
import { SignalService } from '../../lib/signal-service'

export interface Inject {
  documentClient: any,
  getSignals: (GRID: string, streamId: string) => Promise<Array<any>>,
  timeNow: () => number
}

export module FirstCompitition {
  const minimumSignals = 17

  export function action(inn: Inject, event: any, context: Context): Promise<any> {
    const log = logger(context.awsRequestId)
    // get streams
    return _.composeP(_.filter((x: any) => x.stats.numberOfSignals >= minimumSignals), getStreams)(context.awsRequestId)
      .map((stream: any) => {
        // get signals
        return inn.getSignals(context.awsRequestId, stream.id)
          .then((signalsRAw: Array<any>) => {
            const signals = _.sort((a: any, b: any) => a.id - b.id)(signalsRAw)
            const length = signals.length
            if (length >= minimumSignals) {
              if (signals[length - 1].signal === 0) {
                return {
                  'id': stream.id,
                  'value': signals[length - 1].valueInclFee,
                  'numberOfSignalsInPeriod': length + 1
                }
              }
              else if (signals[length - 2].signal === 0) {
                return {
                  'id': stream.id,
                  'value': signals[length - 2].valueInclFee,
                  'numberOfSignalsInPeriod': length + 1
                }
              }
              else {
                return 'ERROR!!!'
              }
            }
            else {
              return 'NONE!'
            }
          })
      })
      .then((re: Array<any>) => re.sort((a, b) => b.value - a.value))
  }
}
