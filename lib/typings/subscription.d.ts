export interface Subscription {
  creationTime: number
  email: string
  expirationTime: number
  orderId: string
  paymentBTC: number
  paymentUSD: number
  receiveAddress: string
  refundAddress: string
  renewed?: string
  streamId: string
  transactionId: string
  autoTrader?: string
  autoTraderData?: any
}