  export interface NewStreamRequest {
    name: string
    exchange: string
    currencyPair: string
    payoutAddress: string
    subscriptionPriceUSD: number
    userId?: string
  }