import * as Promise from "bluebird"

export module Coinbase {

  export interface Payout {
    to: string
    amount: string
    currency: string
    description?: string
    idem?: string
  }

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

  /**
   * send money to bitcoin address or email
   */
  export function sendMoney(coinbaseClient: any, payoutAccount: string, payout: Payout): Promise<any> {
    return new Promise((resolve, reject) => {
      coinbaseClient.getAccount(payoutAccount, (err: any, account: any) => {
        if (err) { reject(err) }
        else {
          account.sendMoney(payout, (err: any, tx: any) => {
            if (err) { reject(err) }
            else {
              console.log(tx)
              resolve(tx)
            }
          })
        }

      })
    })
  }

  /**
   * transfare money between my accounts
   */
  export function transferMoney(coinbaseClient: any, payoutAccount: string, payout: Payout): Promise<any> {
    return new Promise((resolve, reject) => {
      coinbaseClient.getAccount(payoutAccount, (err: any, account: any) => {
        if (err) { reject(err) }
        else {
          account.transferMoney(payout, (err: any, tx: any) => {
            if (err) { reject(err) }
            else {
              resolve(tx)
            }
          })
        }

      })
    })
  }

  export function getAccounts(coinbaseClient: any) {
    return new Promise((resolve, reject) => {
      coinbaseClient.getAccounts({}, (err: any, accounts: any) => {
        if (err) { reject(err) }
        else {
          resolve(accounts)
        }
      })
    })
  }
}