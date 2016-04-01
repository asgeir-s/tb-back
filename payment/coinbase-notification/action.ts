import * as _ from "ramda"
import * as Promise from "bluebird"

import { Streams, AuthLevel } from "../../lib/streams"
import { DynamoDb } from "../../lib/aws"
import { Crypto, CryptedData } from "../../lib/crypto"
import { Coinbase } from "../../lib/coinbase"
import { Stream } from "../../lib/typings/stream"
import { Context } from "../../lib/typings/aws-lambda"
import { log } from "../../lib/logger"
import { Responds } from "../../lib/typings/responds"
import { SubscriptionRequest } from "../../lib/typings/subscription-request"
import { Subscription } from "../../lib/typings/subscription"
import { AddSubscriptionResponds } from "../../lib/subscriptions"

/**
 * ToDo: should add subscription to streams topic for notify-email and trade-generator if autotrader is true
 */

const monthMS = 2592000000
export interface Inject {
  getStream: (streamId: string) => Promise<Stream> // must be stream Private
  decryptSubscriptionInfo: (cryptData: CryptedData) => Promise<SubscriptionRequest>
  addSubscription: (subscription: Subscription) => Promise<AddSubscriptionResponds>
  sendMoney: (payout: Coinbase.Payout) => Promise<any>
  transferMoney: (payout: Coinbase.Payout) => Promise<any>
  alert: (message: any) => Promise<any>
  snsSubscribeLambda: (topicArn: string, lambdaArn: string, statementId: string) => Promise<any>
  timeNow: () => number
  cludaVault: string
  tradeGeneratorLambdaArn: string,
  notifyEmailLambdaArn: string
}

export module CoinbaseNotification {
  export function action(inn: Inject, event: any, context: Context): Promise<Responds> {

    return inn.decryptSubscriptionInfo(event.data.metadata)
      .then(subscriptionInfo => {
        if (event.type === "wallet:orders:paid") {
          log.info("received order paid", {
            "subscriptionInfo": subscriptionInfo
          })

          const renewing = _.prop("oldexpirationTime", subscriptionInfo) !== undefined
          const oldexpirationTime = renewing ? subscriptionInfo.oldexpirationTime : -1
          const btcAmout = parseFloat(event.data.bitcoin_amount.amount)
          const orderId = event.data.id

          const cludaAmount = (btcAmout * 0.3).toFixed(8)
          const publisherAmount = (btcAmout * 0.7).toFixed(8)

          return inn.addSubscription({
            creationTime: inn.timeNow(),
            email: subscriptionInfo.email,
            expirationTime: _.max(inn.timeNow() + monthMS, oldexpirationTime + monthMS),
            orderId: orderId,
            paymentBTC: event.data.bitcoin_amount.amount,
            paymentUSD: event.data.amount.amount,
            receiveAddress: event.data.bitcoin_address,
            refundAddress: event.data.refund_address,
            renewed: renewing,
            streamId: subscriptionInfo.streamId,
            transactionId: event.data.transaction.id,
            autoTrader: subscriptionInfo.autoTrader,
            autoTraderData: subscriptionInfo.autoTraderData,
            apiKey: subscriptionInfo.apiKey,
            apiSecret: subscriptionInfo.apiSecret,
          })
            .then(res => {
              log.info("responds from addSubscription", res)
              return inn.getStream(subscriptionInfo.streamId)
            })
            .then(stream => {
              const cludaPayout = {
                type: "transfer",
                to: inn.cludaVault,
                amount: cludaAmount.toString(),
                currency: "BTC",
                description: "Cluda payout for subscription with order id " + orderId,
                idem: orderId + "Cluda",
              }

              const publisherPayout = {
                type: "send",
                to: stream.streamPrivate.payoutAddress,
                amount: publisherAmount.toString(),
                currency: "BTC",
                description: "Publisher payout for new subscription",
                idem: orderId + "Publisher",
              }

              log.info("CLUDA PAYOUT", + cludaPayout)
              log.info("PUBLISHER PAYOUT", publisherPayout)

              if (subscriptionInfo.autoTrader) {
                return Promise.all([
                  inn.transferMoney(cludaPayout),
                  inn.sendMoney(publisherPayout),
                  inn.snsSubscribeLambda(stream.streamPrivate.topicArn, inn.notifyEmailLambdaArn,
                    inn.timeNow().toString() + "1"),
                  inn.snsSubscribeLambda(stream.streamPrivate.topicArn, inn.tradeGeneratorLambdaArn,
                    inn.timeNow().toString() + "2")
                ])
              }
              else {
                return Promise.all([
                  inn.transferMoney(cludaPayout),
                  inn.sendMoney(publisherPayout),
                  inn.snsSubscribeLambda(stream.streamPrivate.topicArn, inn.notifyEmailLambdaArn,
                    inn.timeNow().toString() + "1")
                ])
              }
            })
            .then(res => {
              log.info("CLUDA PAYOUT RESPONDS", res[0])
              log.info("PUBLISHER PAYOUT RESPONDS", res[1])
              log.info("SNS EMAIL-NOTIFY SUBSCRIPTION RESPONDS", res[2])

              if (subscriptionInfo.autoTrader) {
                log.info("SNS TRADE-GENERATOR SUBSCRIPTION RESPONDS", res[3])
              }

              const respondsData: any = {
                "cludaPayoutId": res[0].id,
                "publisherPayoutId": res[1].id
              }
              return {
                "GRID": context.awsRequestId,
                "success": true,
                "data": respondsData
              }
            })

        }

        else if (event.type === "wallet:orders:mispaid") {
          log.info("received order mispaid", {
            "subscriptionInfo": subscriptionInfo
          })
          inn.alert("received order mispaid for subscription: email:" + subscriptionInfo.email +
            ", streamId:" + subscriptionInfo.streamId + ", oldexpirationTime:" + subscriptionInfo.oldexpirationTime +
            ", coinbaseNotification: " + JSON.stringify(event))
          return {
            "GRID": context.awsRequestId,
            "data": "handled mispayment",
            "success": true
          }
        }

        else {
          log.info("received unknown notification type", {
            "event": event.type
          })
          return {
            "GRID": context.awsRequestId,
            "data": "nothing done. Unknown notification type",
            "success": true
          }
        }
      })
  }
}

