import * as _ from "ramda"
import * as Promise from "bluebird"

import { DynamoDb, SES } from "../../lib/aws"
import { Context } from "../../lib/typings/aws-lambda"
import { EmailTemplete } from "../../lib/email-template"
import { Subscriptions } from "../../lib/subscriptions"
import { PaymentService } from "../../lib/payment-service"
import { logger } from "../../lib/logger"
import { Subscription } from "../../lib/typings/subscription"
import { Responds } from "../../lib/typings/responds"

export interface Inject {
  sendEmail: (email: SES.Email) => any
  load: (attributes: Array<string>) => Promise<any>
  save: (items: Array<Array<any>>) => Promise<any>
  getExpieringSubscriptions: (fromTime: number, toTime: number) => Promise<Array<Subscription>>
  getPayemntCode: (GRID: string, subscription: Subscription) => Promise<PaymentService.PaymentCode>
  timeNow: () => number
}

export module ContinueSubscriptionEmail {
  const msInDay = 86400000

  export function action(inn: Inject, event: any, context: Context): Promise<Responds> {
    const log = logger(context.awsRequestId)
    let lastExpiration: number = 0

    return inn.load(["lastProsessedExpiration"])
      .then((res: any) => {
        lastExpiration = res.lastProsessedExpiration
        log.info("loaded lastProsessedExpiration: " + lastExpiration)
        return inn.getExpieringSubscriptions(lastExpiration + 1, inn.timeNow() + msInDay * 5)
      })
      .map((subscription: Subscription) => {
        lastExpiration = _.max(lastExpiration, subscription.expirationTime)
        log.info("sending email for subscription: " + JSON.stringify(subscription))
        return _.composeP(
          inn.sendEmail,
          _.curry(composeEmail)("Subscription Expiring Soon", subscription),
          _.curry(inn.getPayemntCode)(context.awsRequestId)
        )(subscription)
      })
      .then((sesResponds: any) => {
        _.isEmpty(sesResponds) ?
          log.info("no new emails to send") :
          log.info("snsResponds:" + JSON.stringify(sesResponds))
        return _.isEmpty(sesResponds) ?
          "did NOT save anything to DynemoDB" :
          inn.save([["lastProsessedExpiration", lastExpiration]])
      })
      .then((dynemoDBResponds: any) => {
        log.info("dynemoDBResponds: " + JSON.stringify(dynemoDBResponds))
        return {
          "GRID": context.awsRequestId,
          "message": "saved lastProsessedExpiration: " + lastExpiration,
          "success": true
        }
      })
  }

  function composeEmail(subjectIn: string, subscription: Subscription,
    paymentCode: PaymentService.PaymentCode): SES.Email {

    return {
      subject: subjectIn,
      body: EmailTemplete.newEmailBody(
        "Subscription Expiring Soon",
        `<p style="text-align: center;">Your subscription is expiring at ` +
        (new Date(subscription.expirationTime)) +
        `.</p> <p style="text-align: center;margin-bottom: 30px;font-size: 1.3em;">` +
        `<a style="text-align: center;font-size: 1.3em;" href="https://www.coinbase.com/checkouts/` +
        paymentCode.embed_code +
        `" target="_blank">Continue subscription for 30 more days</a></p>`,
        subscription.streamId),
      resipians: [subscription.email]
    }
  }
}
