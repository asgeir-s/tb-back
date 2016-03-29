/**
 * POST: /streams/'streamID'/subscriptionButtonCode, {
 *   "email": "some@email.com",
 *    "apiKey": "exchangeKey",
 *    "apiSecret": "exchangeSecret",
 *    "signalsToEmail": true
 *    "oldexpirationTime": 145638763289 <- optional (only use for continued subscriptions)
 * } 
 * => { 
 *        "id": "fdskalhjfdsajklfhdfsafdsa",
 *        "embed_code": "dkhdksjdhfjks"
 *    }
 * 
 * POST: /coinbase/callback, {
 *     'coinbase cllback'
 * } 
 * => {}, header: status: OK
 */



export module Payment {
  export function coinbaseClient(apiKey: string, apiSecret: string) {
    const clientFac = require("coinbase").Client
    return new clientFac({ "apiKey": apiKey, "apiSecret": apiSecret })
  }

  // priceUSD, name, description, metadata
  export function createCheckout(coinbaseClient: any, name: string, priceUSD: string, description:
    string, metadata: any): Promise<any> {
    return new Promise((resolve, reject) => {
      coinbaseClient.createCheckout({
        "amount": priceUSD,
        "currency": "USD",
        "name": name,
        "description": description,
        "metadata": metadata
      }, (err: any, checkout: any) => err ? reject(err) : resolve(checkout)
      )
    })

  }

}