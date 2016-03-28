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
  export function getPaymentCode(subscriptionInfo: any) {

  }

}