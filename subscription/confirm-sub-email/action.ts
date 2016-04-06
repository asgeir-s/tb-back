import * as _ from "ramda"
import * as Promise from "bluebird"

import { Context } from "../../lib/common/typings/aws-lambda"
import { log } from "../../lib/logger"
import { SES } from "../../lib/common/aws"
import { EmailTemplete } from "../../lib/email-template"
import { Streams } from "../../lib/common/streams"
import { Stream } from "../../lib/common/typings/stream"
import { Responds } from "../../lib/common/typings/responds"

export interface Inject {
  sendEmail: (email: SES.Email) => any
  getStream: (streamId: string) => Promise<Stream>
  timeNow: () => number
}

export module ConfirmSubscriptionEmail {
  export function action(inn: Inject, event: any, context: Context): Promise<Responds> {

    if (event.Records.length !== 1) {
      log.error("noe emails sent, wrong number of records. Should be 1, but was " + event.Records.length + ".",
        { "event": event })
      throw new Error("noe emails sent, wrong number of records. Should be 1, but was " + event.Records.length + ".")
    }
    else {
      const record = event.Records[0]
      if (record.eventName === "INSERT") {
        const newSubscriberEmail = record.dynamodb.NewImage.email.S
        const streamId = record.dynamodb.Keys.streamId.S
        const subscriptionExpirationTime = new Date(record.dynamodb.NewImage.expirationTime.N * 1)

        return inn.getStream(streamId)
          .then(stream => {
            let emailBody = ""
            if (stream.lastSignal.signal === 0) {
              emailBody = EmailTemplete.newEmailBody(
                "Subscription Confirmation for " + stream.name,
                `<p style="margin-top: 50px;">Streams current position is <b>` +
                signalFromNumber(stream.lastSignal.signal) + `</b>. This position was taken ` +
                new Date(stream.lastSignal.timestamp) + `.</p>` + `<p style="margin-bottom: 20px;">From now until ` +
                subscriptionExpirationTime + `, you will receive new signals as they are published in this stream.</p>`,
                streamId
              )
            }
            else {
              emailBody = EmailTemplete.newEmailBody(
                "Subscription Confirmation for " + stream.name,
                `<p style="margin-top: 50px;">Streams current position is <b>` +
                signalFromNumber(stream.lastSignal.signal) + `</b>. This position was taken ` +
                new Date(stream.lastSignal.timestamp) + `, the price was $` + stream.lastSignal.price +
                `</p><p style="margin-bottom: 20px;">From now until ` + subscriptionExpirationTime +
                `, you will receive new signals as they are published in this stream.</p>`,
                streamId
              )
            }

            return inn.sendEmail({
              subject: "TradersBit: Subscription Confirmation",
              body: emailBody,
              resipians: [newSubscriberEmail]
            }).then((res: any) => {
              log.info("email sent to", newSubscriberEmail)
              log.info("SES send email responds", res)
              return {
                "GRID": context.awsRequestId,
                "data": "confirm email sent to subscriber",
                "success": true
              }
            })
          })
      }
      else {
        log.info('noe emails sent, this was not a "INSERT" event', {
          "eventType": record.eventName
        })
        return Promise.resolve({
          "GRID": context.awsRequestId,
          "data": "not relevant event type",
          "success": true
        })
      }

    }
  }

  function signalFromNumber(position: number): string {
    switch (position) {
      case -1:
        return "SHORT"
      case 0:
        return "CLOSE"
      case 1:
        return "LONG"
      default:
        return "unvalide signal"
    }
  }

}
