import * as _ from "ramda"
import * as Promise from "bluebird"

export module Bitfinex {

  export function executeMarketOrder(apiKey: string, apiSecret: string, symbol: string, amount: number,
    position: number): Promise<any> {

  }

  export function getAvalibleBalance(apiKey: string, apiSecret: string): Promise<number> {

  }

  export function getOrderStatus(apiKey: string, apiSecret: string, orderId: string): Promise<any> {

  }