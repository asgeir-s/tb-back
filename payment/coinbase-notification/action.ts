import * as _ from "ramda"
import * as Promise from "bluebird"

import { Streams } from "../../lib/common/streams"
import { DynamoDb } from "../../lib/common/aws"
import { Crypto, CryptedData } from "../../lib/common/crypto"
import { Coinbase } from "../../lib/coinbase"
import { Stream } from "../../lib/common/typings/stream"
import { Context } from "../../lib/common/typings/aws-lambda"
import { log } from "../../lib/logger"
import { Responds } from "../../lib/common/typings/responds"
import { SubscriptionRequest } from "../../lib/common/typings/subscription-request"
import { Subscription } from "../../lib/common/typings/subscription"
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
  snsSubscribeLambda: (topicArn: string, lambdaArn: string, statementId: string) => Promise<string>
  timeNow: () => number
  cludaVault: string
  tradeGeneratorLambdaArn: string,
  notifyEmailLambdaArn: string,
  autoTraderPriceUsd: number
}

export module CoinbaseNotification {
  export function action(inn: Inject, event: any, context: Context): Promise<Responds> {

    return inn.decryptSubscriptionInfo(event.data.metadata)
      .then(subscriptionInfo => {
        if (event.type === "wallet:orders:paid") {
          log.info("received order paid", { "subscriptionInfo": subscriptionInfo })

          const renewing = _.prop("oldexpirationTime", subscriptionInfo) !== undefined
          const oldexpirationTime = renewing ? subscriptionInfo.oldexpirationTime : -1
          const orderId = event.data.id
          const usdAmount = parseFloat(event.data.amount.amount)
          let btcAmout = parseFloat(event.data.bitcoin_amount.amount)

          const autoTraderPriceBtc = (btcAmout / usdAmount) * inn.autoTraderPriceUsd
          console.log("autoTraderPriceBtc: " + autoTraderPriceBtc)

          let cludaAmount = 0
          let publisherAmount = 0

          if (subscriptionInfo.autoTrader) {  // autotraders price must be in BTC not usd
            cludaAmount += autoTraderPriceBtc
            btcAmout -= autoTraderPriceBtc
          }

          cludaAmount += (btcAmout * 0.3)
          publisherAmount += (btcAmout * 0.7)

          const cludaAmountString = cludaAmount.toFixed(8)
          const publisherAmountString = publisherAmount.toFixed(8)

          console.log("cludaAmount: " + cludaAmountString)
          console.log("publisherAmount: " + publisherAmountString)

          return inn.addSubscription({
            creationTime: inn.timeNow(),
            email: subscriptionInfo.email,
            expirationTime: _.max(inn.timeNow() + monthMS, oldexpirationTime + monthMS),
            orderId: orderId,
            paymentBtc: parseFloat(event.data.bitcoin_amount.amount),
            paymentUsd: parseFloat(event.data.amount.amount),
            receiveAddress: event.data.bitcoin_address,
            refundAddress: event.data.refund_address,
            renewed: false, //renewing TODO the old subscription should get this
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
                amount: cludaAmountString,
                currency: "BTC",
                description: "Cluda payout for subscription with order id " + orderId,
                idem: orderId + "Cluda",
              }

              const publisherPayout = {
                type: "send",
                to: stream.streamPrivate.payoutAddress,
                amount: publisherAmountString,
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
              log.info("SNS EMAIL-NOTIFY SUBSCRIPTION ARN", res[2])

              if (subscriptionInfo.autoTrader) {
                log.info("SNS TRADE-GENERATOR SUBSCRIPTION ARN", res[3])
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
            "success": false
          }
        }
      })
  }
}

