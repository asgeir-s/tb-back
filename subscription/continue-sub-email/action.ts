import * as _ from "ramda"
import * as Promise from "bluebird"

import { DynamoDb, SES } from "../../lib/common/aws"
import { Context } from "../../lib/common/typings/aws-lambda"
import { EmailTemplete } from "../../lib/email-template"
import { Subscriptions } from "../../lib/subscriptions"
import { SubscriptionRequest } from "../../lib/common/typings/subscription-request"
import { log } from "../../lib/logger"
import { Subscription } from "../../lib/common/typings/subscription"
import { Responds } from "../../lib/common/typings/responds"
import { Stream } from "../../lib/common/typings/stream"
import { CryptedData } from "../../lib/common/crypto"


export interface Inject {
  sendEmail: (email: SES.Email) => any
  load: (attributes: Array<string>) => Promise<any>
  save: (items: Array<Array<any>>) => Promise<any>
  getExpieringSubscriptions: (fromTime: number, toTime: number) => Promise<Array<Subscription>>
  getStream: (streamId: string) => Promise<Stream>
  encryptSubscriptionInfo: (subscriptionInfo: SubscriptionRequest) => Promise<CryptedData>
  createCheckout: (name: string, priceUSD: string, description: string, cryptedMetadata: any) => Promise<any>
  autoTraderPrice: number
  timeNow: () => number
}

export module ContinueSubscriptionEmail {
  const msInDay = 86400000

  export function action(inn: Inject, event: any, context: Context): Promise<Responds> {
    let lastExpiration: number = 0

    return inn.load(["lastProsessedExpiration"])
      .then((res: any) => {
        lastExpiration = res.lastProsessedExpiration
        log.info("loaded lastProsessedExpiration", {
          "lastExpiration": lastExpiration
        })
        return inn.getExpieringSubscriptions(lastExpiration + 1, inn.timeNow() + msInDay * 5)
      })
      .map((subscription: Subscription) => {
        lastExpiration = _.max(lastExpiration, subscription.expirationTime)

        const subscriptionRequest = {
          "email": subscription.email,
          "streamId": subscription.streamId,
          "autoTrader": subscription.autoTrader,
          "apiKey": subscription.apiKey,
          "apiSecret": subscription.apiSecret,
          "oldexpirationTime": subscription.expirationTime
        }

        log.info("subscriptionRequest", subscriptionRequest)

        return Promise.all([
          inn.getStream(subscriptionRequest.streamId),
          inn.encryptSubscriptionInfo(subscriptionRequest)
        ])
          .then(res => {
            const stream = res[0]
            const encryptedSubscriptionInfo = res[1]

            let price = stream.subscriptionPriceUSD
            if (event.autoTrader === "true") { price += inn.autoTraderPrice }

            log.info("price", price)

            return inn.createCheckout("Stream Subscription", price.toString(), "Subscription to stream: " +
              stream.name + ", autoTrader: " + event.autoTrader, encryptedSubscriptionInfo)
          })
          .then(checkout => {
            log.info("checkout from coinbase", checkout)
            return composeEmail("Subscription Expiring Soon", subscription, checkout.embed_code)
          })
          .then(email => {
            log.info("sending email", {
              "subject": email.subject,
              "resipians": email.resipians
            })
            inn.sendEmail(email)
          })
      })
      .then((sesRespondses: Array<any>) => {
        _.isEmpty(sesRespondses) ?
          log.info("no new emails to send", "") :
          log.info("snsRespondses", sesRespondses)
        return _.isEmpty(sesRespondses) ?
          "did NOT save anything to DynemoDB" :
          inn.save([["lastProsessedExpiration", lastExpiration]])
      })
      .then((dynemoDBResponds: any) => {
        log.info("dynemoDBResponds", dynemoDBResponds)
        return {
          "GRID": context.awsRequestId,
          "data": "saved lastProsessedExpiration: " + lastExpiration,
          "success": true
        }
      })

  }

  function composeEmail(subjectIn: string, subscription: Subscription,
    paymentCode: string): SES.Email {

    return {
      subject: subjectIn,
      body: EmailTemplete.newEmailBody(
        "Subscription Expiring Soon",
        `<p style="text-align: center;">Your subscription is expiring at ` +
        (new Date(subscription.expirationTime)) +
        `.</p> <p style="text-align: center;margin-bottom: 30px;font-size: 1.3em;">` +
        `<a style="text-align: center;font-size: 1.3em;" href="https://www.coinbase.com/checkouts/` +
        paymentCode +
        `" target="_blank">Continue subscription for 30 more days</a></p>`,
        subscription.streamId),
      resipians: [subscription.email]
    }
  }
}
