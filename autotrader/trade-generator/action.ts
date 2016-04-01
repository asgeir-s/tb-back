import * as _ from "ramda"
import * as Promise from "bluebird"

import { Context } from "../../lib/typings/aws-lambda"
import { SNS } from "../../lib/aws"
import { log } from "../../lib/logger"
import { Responds } from "../../lib/typings/responds"

export interface Inject {
  getSubscriptions: (streamId: string, timeNow: number) => Promise<Array<any>>,
  snsPublish: (message: any) => Promise<SNS.Responds>,
  timeNow: () => number
}

export module TradeGenerator {

  export function action(inn: Inject, event: any, context: Context): Promise<Responds> {
    const message = JSON.parse(event.Records[0].Sns.Message)

    // get active-autotrader sbuscriptions for stream
    return inn.getSubscriptions(message.streamId, inn.timeNow())
      .map((subscription: any) => {
        // publish trads to SNS topic
        return inn.snsPublish({
          subscription: subscription,
          signals: message.signals
        })
      })
      // handle responds to the caller
      .then(respondses => {
        if (_.isEmpty(respondses)) {
          log.info("theire are no active autotrader subscribers for stream", { "streamId": message.streamId })
          // stop subscribing to this stream topic
          return {
            "GRID": context.awsRequestId,
            "data": "no active autotrader subscribers",
            "success": true
          }
        }
        else {
          // check for failour publishing the trads
          const failed = respondses.filter(x => typeof x.MessageId === "undefined" || x.MessageId === null)

          if (_.isEmpty(failed)) {
            log.info("published trade for " + respondses.length + " subscribers", respondses)
            return {
              "GRID": context.awsRequestId,
              "data": "published trade for " + respondses.length + " subscribers",
              "success": true
            }
          }
          else {
            log.error("failed to publish " + failed.length + " out of " +
              respondses.length + " to trade SNS topic", { "failed": failed })

            return {
              "GRID": context.awsRequestId,
              "data": "failed to publish trade for " + failed.length + " out of " +
              respondses.length + " subscrbers",
              "success": false
            }
          }

        }
      })
  }
}