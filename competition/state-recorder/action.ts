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
    updateOrAddAttribute: (primaryKey: any, attributeUpdates: any) => Promise<any>,
    recordeStartTime: number
  }

  export function action(inn: Inject, records: Array<any>, context: Context): Promise<Responds> {

    return Promise.map(records, record => {
      const newImage = record.dynamodb.NewImage
      const alreadyRecorded = _.has("recordedState", newImage) &&
        _.has(inn.recordeStartTime.toString(), newImage.recordedState.M)

      if (!alreadyRecorded &&
        newImage.timeOfLastSignal.N >= inn.recordeStartTime) {
        const lastSignal = JSON.parse(newImage.lastSignal.S)

        return recordState(record.dynamodb.Keys.id.S, inn.recordeStartTime, lastSignal, newImage.recordedState)
          .then(res => {
            return {
              "message": "recorded last signal",
              "streamId": record.dynamodb.Keys.id.S,
              "signal": lastSignal
            }
          })
      }
      else {
        return Promise.resolve({
          "message": alreadyRecorded ? "already recorded" : "time is before recordeStartTime or stream has no signals",
          "streamId": record.dynamodb.Keys.id.S,
        })
      }
    })
      .then(dataRes => {
        return {
          "GRID": context.awsRequestId,
          "data": dataRes,
          "success": true
        }
      })


    function recordState(streamId: string, timeStamp: number, signal: Signal, previousRecordedState: any):
      Promise<any> {
      const newValue = previousRecordedState == null ? {} : previousRecordedState.M
      newValue[timeStamp.toString()] = { "firstSignal": signal }
      return inn.updateOrAddAttribute({ "id": streamId },
        {
          "recordedState": {
            "Action": "PUT",
            "Value": newValue
          }
        })
    }
  }

}
