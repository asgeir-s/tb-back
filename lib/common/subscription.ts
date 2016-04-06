import * as Promise from "bluebird"
import * as request from "request"

import { SubscriptionRequest } from "../../lib/common/typings/subscription-request"
import { Responds } from "../../lib/common/typings/responds"


const requestAsync = Promise.promisify(request)

export module Subscription {

  export function getPaymentCode(subscriptionUrl: string, GRID: string, subscriptionRequest: SubscriptionRequest):
    Promise<Responds> {
    return requestAsync({
      method: "POST",
      uri: subscriptionUrl + "/payment-code-from-subscription",
      body: subscriptionRequest,
      headers: {
        "Global-Request-ID": GRID,
        "content-type": "application/json"
      },
      json: true
    }).then((res: any) => res.body)
  }

}
