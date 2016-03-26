import * as _ from 'ramda'
import * as Promise from 'bluebird'

import { Context } from '../../lib/typings/aws-lambda'
import { logger } from '../../lib/logger'
import { SES } from '../../lib/aws'
import { EmailTemplete } from '../../lib/email-template'
import { StreamService } from '../../lib/stream-service'
import { Stream } from '../../lib/typings/stream'
import { SES } from '../../lib/aws'


export interface Inject {
  documentClient: any,
  sendEmail: (email: SES.Email) => any,
  getStream: (GRID: string, streamId: string) => any
  timeNow: () => number
}

const sendEmail = _.curry(SES.send)(SES.sesClientAsync(process.env.AWS_SNS_REGION), process.env.SUBSCRIPTION_INFO_FROM_EMAIL)
const getStream = _.curry(StreamService.getStream)(process.env.SERVICE_STREAMS, process.env.SERVICE_STREAMS_APIKEY, 'private')

export module ConfirmSubscriptionEmail {
  export function action(event: any, context: Context): Promise<any> {
    const log = logger(context.awsRequestId)
    log.info('event: ' + JSON.stringify(event));

    if (event.Records.length !== 1) {
      log.error("noe emails sent, wrong number of records. Should be 1, but was " + event.Records.length + '.')
      throw new Error("noe emails sent, wrong number of records. Should be 1, but was " + event.Records.length + '.')
    }
    else {
      const record = event.Records[0]
      if (record.eventName === 'INSERT') {
        const newSubscriberEmail = record.dynamodb.NewImage.email.S;
        const streamId = record.dynamodb.Keys.streamId.S;
        const subscriptionExpirationTime = new Date(record.dynamodb.NewImage.expirationTime.N * 1);

        return getStream(context.awsRequestId, streamId)
          .then((stream: Stream) => {
            log.info('stream: ' + stream.id)

            let emailBody = ''
            if (stream.lastSignal.signal === 0) {
              emailBody = EmailTemplete.newEmailBody(
                'Subscription Confirmation for ' + stream.name,
                `<p style="margin-top: 50px;">Streams current position is <b>` + signalFromNumber(stream.lastSignal.signal) +
                `</b>. This position was taken ` + new Date(stream.lastSignal.timestamp) + `.</p>` +
                `<p style="margin-bottom: 20px;">From now until ` + subscriptionExpirationTime + `, you will receive new signals` +
                ` as they are published in this stream.</p>`
                ,
                streamId
              )
            }
            else {
              emailBody = EmailTemplete.newEmailBody(
                'Subscription Confirmation for ' + stream.name,
                `<p style="margin-top: 50px;">Streams current position is <b>` + signalFromNumber(stream.lastSignal.signal) +
                `</b>. This position was taken ` + new Date(stream.lastSignal.timestamp) + `, the price was $` +
                stream.lastSignal.price + `</p><p style="margin-bottom: 20px;">From now until ` + subscriptionExpirationTime +
                `, you will receive new signals as they are published in this stream.</p>`,
                streamId
              )
            }

            return sendEmail({
              subject: "TradersBit: Subscription Confirmation",
              body: emailBody,
              resipians: [newSubscriberEmail]
            }).then((res: any) => {
              log.info('SES send email responds: ' + JSON.stringify(res))
              return {
                "GRID": context.awsRequestId,
                "message": "email sent to: " + newSubscriberEmail,
                "status": "success"
              }
            })
          })
      }
      else {
        log.info("noe emails sent, this was not a 'INSERT' event. Event type was: '" + record.eventName + "'.")
        return Promise.resolve({
          "GRID": context.awsRequestId,
          "message": "not relevant event type",
          "status": "success"
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
