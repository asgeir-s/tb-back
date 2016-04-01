import * as _ from "ramda"
import * as Promise from "bluebird"

import { DynamoDb, SES } from "../../lib/aws"
import { Context } from "../../lib/typings/aws-lambda"
import { EmailTemplete } from "../../lib/email-template"
import { log } from "../../lib/logger"
import { Streams } from "../../lib/streams"
import { Signals } from "../../lib/signals"
import { Responds } from "../../lib/typings/responds"

export interface Inject {
  documentClient: any,
  streamTableName: string,
  getSignals: (GRID: string, streamId: string) => Promise<Array<any>>,
  timeNow: () => number,
}

export module FirstCompitition {
  const minimumClosedTrades = 17

  export function action(inn: Inject, event: any, context: Context): Promise<Responds> {

    // get streams
    return inn.documentClient.scanAsync({
      TableName: inn.streamTableName,
      FilterExpression: "numberOfClosedTrades > :closed",
      ProjectionExpression: "id",
      ExpressionAttributeValues: {
        ":closed": minimumClosedTrades
      }
    })
      .then((res: any) => res.Items)
      .map((stream: { id: string }) => {

        // get signals
        return inn.getSignals(context.awsRequestId, stream.id)
          .then((signalsRaw: Array<any>) => {
            const signals = _.sort((a: any, b: any) => a.id - b.id)(signalsRaw)
            const length = signals.length
            if (signals[length - 1].signal === 0) {
              return {
                "id": stream.id,
                "value": signals[length - 1].valueInclFee,
                "numberOfSignalsInPeriod": length + 1
              }
            }
            else if (signals[length - 2].signal === 0) {
              return {
                "id": stream.id,
                "value": signals[length - 2].valueInclFee,
                "numberOfSignalsInPeriod": length + 1
              }
            }
            else {
              return "error"
            }
          })
      })
      .then((re: Array<any>) => re.sort((a, b) => b.value - a.value))
      .then((res: Array<any>) => {
        return {
          "GRID": context.awsRequestId,
          "success": true,
          "data": res
        }
      })
  }
}
