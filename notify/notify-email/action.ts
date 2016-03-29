import * as _ from 'ramda'
import * as Promise from 'bluebird'

import { Context } from '../../lib/typings/aws-lambda'
import { EmailTemplete } from '../../lib/email-template'
import { SES, DynamoDb } from '../../lib/aws'
import { Subscriptions } from '../../lib/subscriptions'
import { logger } from '../../lib/logger'
import { Responds } from '../../lib/typings/responds'

export interface Inject {
  sendEmail: (email: SES.Email) => Promise<any>,
  getActiveSubscriptions: (streamId: string, expirationTime: number) => Promise<any>,
  timeNow: () => number
}

export module NotifyEmail {

  export function action(inn: Inject, event: any, context: Context): Promise<Responds> {
    const log = logger(context.awsRequestId)
    log.info('event: ' + JSON.stringify(event))

    const message = JSON.parse(event.Records[0].Sns.Message)
    log.info('streamId: ' + message.streamId + ', subscriptionTable:' + process.env.AWS_DYNAMO_SUBSCRIPTIONTABLE +
      ', signals:' + JSON.stringify(message.signals))

    return inn.getActiveSubscriptions(message.streamId, inn.timeNow())
      .then((subscriptions: any) => {
        if (_.isEmpty(subscriptions)) {
          log.info('theire are no active email subscribers for stream with id: ' + message.streamId)
          return {
            "GRID": context.awsRequestId,
            "message": "no active email subscribers",
            "success": true
          }
        }
        else {
          const email: SES.Email = {
            subject: generateEmailSubject(message.streamName, message.signals),
            body: generateEmailBody(message.streamId, message.streamName, message.signals),
            resipians: _.map(_.prop('email'), subscriptions)
          }
          const logEmail = _.clone(email)
          logEmail.body = logEmail.body.substr(0, 20)
          log.info('sending email: ' + JSON.stringify(logEmail))

          return inn.sendEmail(email).then((responds: any) => {
            return {
              "GRID": context.awsRequestId,
              "message": responds,
              "success": true
            }
          })
        }
      })
  }

  function signalFromNumber(position: number): string {
    switch (position) {
      case -1:
        return 'SHORT'
      case 0:
        return 'CLOSE'
      case 1:
        return 'LONG'
      default:
        return 'unvalide signal'
    }
  }

  function generateEmailBody(streamId: string, streamName: string, signals: any) {
    const price: string = signals[0].price.toFixed(2);
    const date = new Date(signals[0].timestamp);
    let signalContent: string = '';
    let change: string = '';
    let pluralOr = 'signal';
    if (signals.length === 1) {
      if (signals[0].signal === 0) {
        change = (signals[0].changeInclFee * 100).toFixed(2);
      }

      signalContent = `<p style="font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
        font-size: 14px; line-height: 1.6em; font-weight: normal; margin: 0 0 10px; padding: 0;background-color: ` +
        signalBackgroundColor(signals) + `;width: 100%;text-align: center;/* border-radius: 10px; 
        */padding-top: 20px; padding-bottom: 10px;margin-top: 30px;"><b style="font-size: 2em;font-weight: 400;">` +
        signalFromNumber(signals[0].signal) + `</b></p>`

    }
    else {
      const lastSignal = maxById(signals)
      pluralOr = 'signals'
      change = ((signals[0].changeInclFee + signals[1].changeInclFee) * 100).toFixed(2);

      signalContent = `<p>First:</p> <p style="font-family: 'Helvetica Neue', 'Helvetica', Helvetica,
        Arial, sans-serif; font-size: 14px; line-height: 1.6em; font-weight: normal; margin: 0 0 10px; padding: 0;
        background-color: rgb(234, 234, 234);width: 100%;text-align: center;/* border-radius: 10px; */padding-top: 20px;
        padding-bottom: 10px;margin-top: 30px;"><b style="font-size: 2em;font-weight: 400;">CLOSE</b></p>
        <p>Then:</p>
        <p style="font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 14px; 
        line-height: 1.6em; font-weight: normal; margin: 0 0 10px; padding: 0;background-color: `
        + signalBackgroundColor(signals) +
        `;width: 100%;text-align: center;/* border-radius: 10px; */padding-top: 20px;padding-bottom: 10px;
        margin-top: 30px;"><b style="font-size: 2em;font-weight: 400;">` +
        signalFromNumber(lastSignal.signal) +
        `</b></p>`
    }
    const chnage = _.equals(change, '') ? '' : `<li><b>Change(incl.fee): </b>` + change + `%</li>`

    return EmailTemplete.newEmailBody(
      'Trading ' + pluralOr + ' from ' + streamName,
      signalContent + `<ul style="margin: auto;padding-top: 15px;margin-bottom: 20px;">
      <li><b>Price: </b>$` + price + `</li>
      <li><b>Time: </b>` + date + `</li>` +
      chnage + `</ul>`,
      streamId
    )

  }

  function signalBackgroundColor(signals: any): string {
    if (signals.length === 1) {
      if (signals[0].signal === 1) {
        return '#c7f3cb'
      }
      else if (signals[0].signal === -1) {
        return '#f3d7cd'
      }
      else {
        return 'rgb(234, 234, 234)'
      }
    }
    else {
      if (signals[0].signal === 1 || signals[1].signal === 1) {
        return '#c7f3cb'
      }
      else if (signals[0].signal === -1 || signals[1].signal === -1) {
        return '#f3d7cd'
      }
      else {
        return 'rgb(234, 234, 234)'
      }
    }
  }


  const byId = (n: any) => +_.propOr(0, 'id')(n)
  const maxById = (signals: Array<any>) => _.reduce(_.maxBy(byId), 0, signals)

  const generateEmailSubject = (streamName: string, signals: any) =>
    (signals.length === 1) ? 'TradersBit: ' + signalFromNumber(signals[0].signal) + ' signal for ' + streamName :
      'TradersBit: Reversed position for ' + streamName

}