export interface SubscriptionRequest {
  email: string
  streamId: string
  autoTrader?: string
  apiKey?: string
  apiSecret?: string
  oldexpirationTime?: number
  autoTraderData?: any
}