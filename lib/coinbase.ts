export module Coinbase {
  export function coinbaseClient(sandbox: string, apiKey: string, apiSecret: string) {
    const clientFac = require("coinbase").Client
    if (sandbox === "true") {
      return new clientFac({
        "apiKey": apiKey,
        "apiSecret": apiSecret,
        "baseApiUri": "https://api.sandbox.coinbase.com/v2/",
        "tokenUri": "https://api.sandbox.coinbase.com/oauth/token"
      })
    }
    else {
      return new clientFac({
        "apiKey": apiKey,
        "apiSecret": apiSecret
      })
    }
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