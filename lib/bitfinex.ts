import * as _ from "ramda"
import * as Promise from "bluebird"
import * as Request from "request"
import * as crypto from "crypto"

const requestPostAsync = Promise.promisify(Request.post)

export module Bitfinex {

  export function executeMarketOrder(apiKey: string, apiSecret: string, symbol: string, amount: number,
    signalNum: number): Promise<any> {

    const payload = {
      "request": "/v1/order/new",
      "nonce": Date.now().toString(),
      "symbol": "BTCUSD",
      "amount": amount.toFixed(8),
      "price": Math.floor(Math.random() * (9999.9777 - 1.433) + 1.433).toFixed(8), // use random number for market orders.
      "exchange": "bitfinex",
      "side": signalNumberToSideString(signalNum),
      "type": "market"
    }

    console.log(">>>>>>> EXECUTE ORDER. payload: " + JSON.stringify(payload))

    return requestPostAsync(sign(payload, apiKey, apiSecret, "https://api.bitfinex.com/v1/order/new"))
      .then((res: any) => {
        console.log(">>>>>>> EXECUTE ORDER. respondse: " + JSON.stringify(res))
        return JSON.parse(res.body)
      })

  }

  /**
   * Your tradable balance in USD (the maximum size you can open on leverage for this pair)
   */
  export function getTradableBalance(apiKey: string, apiSecret: string): Promise<number> {
    const payload = {
      "request": "/v1/balances",
      "nonce": Date.now().toString()
    }
    return requestPostAsync(sign(payload, apiKey, apiSecret, "https://api.bitfinex.com/v1/balances"))
      .then((res: any) =>
        _.find(((item: any) => item.type === "trading" && item.currency === "usd"), JSON.parse(res.body)).available
      )

  }

  export function getOrderStatus(apiKey: string, apiSecret: string, orderId: string): Promise<any> {
    const payload = {
      "order_id": orderId,
      "request": "/v1/order/status",
      "nonce": Date.now().toString()
    }
    return requestPostAsync(sign(payload, apiKey, apiSecret, "https://api.bitfinex.com/v1/order/status"))
      .then((res: any) => JSON.parse(res.body))
  }

  function sign(payloadInn: any, apiKey: string, apiSecret: string, urlInn: string) {
    const payload = new Buffer(JSON.stringify(payloadInn)).toString("base64")
    const signature = crypto.createHmac("sha384", apiSecret).update(payload).digest("hex")
    return {
      url: urlInn,
      headers: {
        "X-BFX-APIKEY": apiKey,
        "X-BFX-PAYLOAD": payload,
        "X-BFX-SIGNATURE": signature
      },
      body: payload
    }
  }

  function signalNumberToSideString(signalNum: number) {
    if (signalNum === 1) {
      return "buy"
    }
    else if (signalNum === -1) {
      return "sell"
    }

  }
}