import * as _ from "ramda"
import * as Promise from "bluebird"
import * as Request from "request"
import * as crypto from "crypto"

const requestPostAsync = Promise.promisify(Request.post)

export module Bitfinex {
  /**
   * Returnes when the position is fully filled (100% executed)
   * 
   * typePosition: should be LONG or SHORT
   */
  export function openPosition(apiKey: string, apiSecret: string, amountBtc: number, typePosition: string) {
    console.log(">>>>>>>> openPosition START!")

    return new Promise((resolve, reject) => {

      executeMarketOrder(apiKey, apiSecret, "btcUSD", amountBtc, positionToSideString(typePosition))
        .then(resOrder => {
          console.log("openPosition / executeMarketOrder res: " + JSON.stringify(resOrder))

          const orderId = resOrder.order_id
          if (parseFloat(resOrder.remaining_amount) !== 0) {

            const intervalObject = setInterval(() => {
              getOrderStatus(apiKey, apiSecret, orderId)
                .then(resStatus => {
                  console.log("openPosition / getOrderStatus (interval) res: " + JSON.stringify(resStatus))

                  if (parseFloat(resStatus.remaining_amount) === 0) {
                    console.log(">>>>>>>> openPosition DONE!")

                    clearInterval(intervalObject)
                    resolve(resStatus)
                  }
                })
            }, 1000)

          }
          else {
            console.log(">>>>>>>> openPosition DONE!")
            resolve(resOrder)
          }
        })
    })
  }

  /**
   * Returnes when the position is fully closed (100% executed)
   */
  export function closeAllPositions(apiKey: string, apiSecret: string) {
    console.log(">>>>>>>> closeAllPositions START!")
    return new Promise((resolve, reject) => {
      cancleAllOrders(apiKey, apiSecret)
        .then(res => {
          console.log("closeAllPositions / cancleAllOrders res: " + JSON.stringify(res))

          getActivePositionBtcUsd(apiKey, apiSecret)
            .then(activeBtcUsdPosition => {
              console.log("closeAllPositions / activeBtcUsdPosition res: " + JSON.stringify(activeBtcUsdPosition))

              const executedAmountBtc = parseFloat(activeBtcUsdPosition.amount)
              const reverseSide = executedAmountBtc > 0 ? "sell" : "buy"
              executeMarketOrder(apiKey, apiSecret, "btcUSD", Math.abs(executedAmountBtc), reverseSide)
                .then(resOrder => {
                  console.log("closeAllPositions / executeMarketOrder res: " + JSON.stringify(resOrder))


                  const orderId = resOrder.order_id
                  if (parseFloat(resOrder.remaining_amount) !== 0) {

                    const intervalObject = setInterval(() => {
                      getOrderStatus(apiKey, apiSecret, orderId)
                        .then(resStatus => {
                          console.log("closeAllPositions / getOrderStatus (interval) res: " + JSON.stringify(resStatus))

                          if (parseFloat(resStatus.remaining_amount) === 0) {
                            console.log(">>>>>>>> closeAllPositions DONE!")
                            clearInterval(intervalObject)
                            resolve(resStatus)
                          }
                        })
                    }, 1000)

                  }
                  else {
                    console.log(">>>>>>>> closeAllPositions DONE!")

                    resolve(resOrder)
                  }
                })
            })

        })
    })
  }

  /**
   * side: should be buy or sell
   */
  export function executeMarketOrder(apiKey: string, apiSecret: string, symbol: string, amount: number,
    side: string): Promise<any> {
    if (amount <= 0.01) {
      throw new Error("Invalid order: minimum size for BTCUSD is 0.01 units. The provided amount was " + amount)
    }

    const payload = {
      "request": "/v1/order/new",
      "nonce": Date.now().toString(),
      "symbol": "BTCUSD",
      "amount": amount.toFixed(8),
      "price": Math.floor(Math.random() * (9999.9777 - 1.433) + 1.433).toFixed(8), // use random number for market orders
      "exchange": "bitfinex",
      "side": side,
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
      "request": "/v1/margin_infos",
      "nonce": Date.now().toString()
    }
    return requestPostAsync(sign(payload, apiKey, apiSecret, "https://api.bitfinex.com/v1/margin_infos"))
      .then((res: any) =>
        _.find((item: any) => item.on_pair === "BTCUSD", JSON.parse(res.body)[0].margin_limits).tradable_balance
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

  export function cancleAllOrders(apiKey: string, apiSecret: string): Promise<any> {
    const payload = {
      "request": "/v1/order/cancel/all",
      "nonce": Date.now().toString()
    }
    return requestPostAsync(sign(payload, apiKey, apiSecret, "https://api.bitfinex.com/v1/order/cancel/all"))
      .then((res: any) => JSON.parse(res.body))
  }


  export function getActivePositionBtcUsd(apiKey: string, apiSecret: string): Promise<any> {
    const payload = {
      "request": "/v1/positions",
      "nonce": Date.now().toString()
    }
    return requestPostAsync(sign(payload, apiKey, apiSecret, "https://api.bitfinex.com/v1/positions"))
      .then((res: any) =>
        _.find((item: any) => item.symbol === "btcusd" && item.status === "ACTIVE", JSON.parse(res.body))
      )
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

  function positionToSideString(signalNum: string) {
    if (signalNum === "LONG") {
      return "buy"
    }
    else if (signalNum === "SHORT") {
      return "sell"
    }

  }

  function reverse(position: number): number {
    if (position === 0) {
      return 0
    }
    else if (position === 1) {
      return -1
    }
    else if (position === -1) {
      return 1
    }
  }

}