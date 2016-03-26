import * as Promise from 'bluebird'
import * as request from 'request'
import * as _ from 'ramda'

const requestAsync = Promise.promisify(request)

const getApiKey = _.propOr('', 'apiKey')
const getApiSecret = _.propOr('', 'apiSecret')

export module PaymentService {

  export interface PaymentCode {
    id: string;
    embed_code: string;
  }

  export function getPaymentCode(paymentServiceUrl: string, paymentServiceApiKey: string,
    GRID: string, subscription: any): Promise<PaymentCode> {
    return requestAsync({
      method: 'POST',
      uri: paymentServiceUrl + '/streams/' + subscription.streamId + '/subscriptionButtonCode',
      headers: {
        "Global-Request-ID": GRID,
        'content-type': 'application/json',
        "Authorization": "apikey " + paymentServiceApiKey
      },
      body: {
        "email": subscription.email,
        "apiKey": getApiKey(subscription),
        "apiSecret": getApiSecret(subscription),
        "signalsToEmail": true,
        "oldExpirationTime": subscription.expirationTime
      },
      json: true
    }).then((res: any) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        throw new Error(res.body);
      }
      else {
        return res.body;
      }
    })
  }

  export function postCallback(paymentServiceUrl: string, paymentServiceApiKey: string, 
  GRID: string, coinbaseCallback: any): Promise<any> {
    console.log('coinbaseCallback: ' + JSON.stringify(coinbaseCallback));
    
    return requestAsync({
      method: 'POST',
      uri: paymentServiceUrl + '/coinbase/callback',
      headers: {
        "Global-Request-ID": GRID,
        'Content-Type': 'application/json',
        "Authorization": "apikey " + paymentServiceApiKey
      },
      body: coinbaseCallback,
      json: true // Automatically parses the JSON string in the response
    }).then((res: any) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        throw new Error('Failed to post callback to the pyment-service. Responds from payment-service: ' + JSON.stringify(res))
      }
      else {
        return res
      }
    })
  }

}