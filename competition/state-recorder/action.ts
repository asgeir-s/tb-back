import * as _ from "ramda"
import * as Promise from "bluebird"

import { DynamoDb, SES } from "../../lib/common/aws"
import { Context } from "../../lib/common/typings/aws-lambda"
import { Stream } from "../../lib/common/typings/stream"
import { EmailTemplete } from "../../lib/email-template"
import { log } from "../../lib/logger"
import { Streams } from "../../lib/common/streams"
import { Signals } from "../../lib/common/signals"
import { Responds } from "../../lib/common/typings/responds"
import { Signal } from "../../lib/common/typings/signal"

/**
 * Records the streams current signal, then unsubscribes this function from the streams SNS-topic
 */
export module StateRecorder {

  export interface Inject {
    setRecordedData: (item: any) => Promise<any>, // do not overwrite
    getRecordedData: (key: any) => Promise<any>,
    snsUnsubscribe: (subscriptionArn: string) => Promise<any>
  }

  export function action(inn: Inject, message: any, context: Context): Promise<Responds> {
    const signal = message.signals[0] as Signal

    return inn.getRecordedData({ "streamId": message.streamId })
      .then(stateDataRes => {
        if (typeof stateDataRes.lastSignal === "undefined") {
          return inn.setRecordedData({
            "streamId": message.streamId,
            "signal": signal
          })
            .then(setRecordedDataRes => inn.snsUnsubscribe(stateDataRes.subscriptionArn))
            .then(snsUnsubscribeRes => {
              return {
                "GRID": context.awsRequestId,
                "data": {
                  "recordedSignal": signal,
                  "stateDataRes": stateDataRes,
                  "unsubscribeLambdaRes": snsUnsubscribeRes
                },
                "success": true
              } as any
            })
        }
        else {
          // error
          return {
            "GRID": context.awsRequestId,
            "data": {
              "message": "already recorded",
              "recordedSignal": signal,
              "stateDataRes": stateDataRes
            },
            "success": false
          }
        }
      })
  }
}
