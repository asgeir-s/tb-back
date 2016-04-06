export interface SubscriptionRequest {
  email: string
  streamId: string
  autoTrader?: boolean
  apiKey?: string
  apiSecret?: string
  oldexpirationTime?: number
  autoTraderData?: any
}