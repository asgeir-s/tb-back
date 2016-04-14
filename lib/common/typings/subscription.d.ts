export interface Subscription {
  creationTime: number
  email: string
  expirationTime: number
  orderId: string
  paymentBtc: number
  paymentUsd: number
  receiveAddress: string
  refundAddress: string
  renewed?: boolean
  streamId: string
  transactionId: string
  autoTrader?: boolean
  autoTraderData?: any
  apiKey: string
  apiSecret: string
}