import * as _ from "ramda"
import * as Promise from "bluebird"

import { Context } from "../../lib/common/typings/aws-lambda"
import { log } from "../../lib/logger"
import { SES } from "../../lib/common/aws"
import { EmailTemplete } from "../../lib/email-template"
import { Stream } from "../../lib/common/typings/stream"
import { Responds } from "../../lib/common/typings/responds"

export interface Inject {
  sendEmail: (email: SES.Email) => Promise<any>
  getStream: (streamId: string) => Promise<Stream>
  getUserEmail: (userId: string) => Promise<string>
  timeNow: () => number
}

export module PubGotSubEmail {
  export function action(inn: Inject, event: any, context: Context): Promise<Responds> {

    if (event.Records.length !== 1) {
      log.error("noe emails sent, wrong number of records. Should be 1, but was " + event.Records.length + ".", "")
      throw new Error("noe emails sent, wrong number of records. Should be 1, but was " + event.Records.length + ".")
    }
    else {
      const record = event.Records[0]
      if (record.eventName === "INSERT") {
        const streamId = record.dynamodb.Keys.streamId.S

        return inn.getStream(streamId)
          .then(stream => {
            log.info("got stream", { "streamId": stream.id })

            // get publisher email form auth0
            return inn.getUserEmail(stream.streamPrivate.userId)
              .then(publisherEmail => {
                log.info("got publisherEmail", publisherEmail)
                const emailBody = EmailTemplete.newEmailBody(
                  "Congratulate!<br>You sold a subscription for " + stream.name,
                  `<h2 style="text-align:center;margin-top: 60px;">` +
                  (record.dynamodb.NewImage.paymentBTC.N * 0.7).toFixed(6) + `฿ &#8776; $` +
                  (record.dynamodb.NewImage.paymentUSD.N * 0.7).toFixed(2) + `</h2>` +
                  `<p style="text-align: center;">
              was transferred to the streams payout address.
              </p>` , streamId)

                return inn.sendEmail({
                  subject: "TradersBit: New Subscriber to " + stream.name,
                  body: emailBody,
                  resipians: [publisherEmail]
                }).then((res: any) => {
                  log.info("SES send email responds", res)
                  return {
                    "GRID": context.awsRequestId,
                    "data": "email sent to: " + publisherEmail,
                    "success": true
                  }
                })
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

}