export module Coinbase {
  export function coinbaseClient(apiKey: string, apiSecret: string) {
    const clientFac = require("coinbase").Client
    return new clientFac({ "apiKey": apiKey, "apiSecret": apiSecret })
  }

  export function createCheckout(coinbaseClient: any, name: string, priceUSD: string,
    description: string, cryptedMetadata: any): Promise<any> {
    return new Promise((resolve, reject) => {
      coinbaseClient.createCheckout({
        "amount": priceUSD,
        "currency": "USD",
        "name": name,
        "description": description,
        "metadata": cryptedMetadata
      }, (err: any, checkout: any) => err ? reject(err) : resolve(checkout)
      )
    })
  }
}