import { Signal } from "./signal"

export interface Stats {
  timeOfLastSignal: number
  accumulatedLoss: number
  numberOfProfitableTrades: number
  numberOfLoosingTrades: number
  numberOfSignals: number
  allTimeValueExcl: number
  maxDrawDown: number
  firstPrice: number
  buyAndHoldChange: number
  accumulatedProfit: number
  timeOfFirstSignal: number
  allTimeValueIncl: number
  numberOfClosedTrades: number
}

export interface StreamPrivate {
  apiKeyId: string
  topicArn: string
  payoutAddress: string
  userId: string
}

export interface Stream {
  currencyPair: string
  name: string
  stats: Stats
  subscriptionPriceUSD: number
  exchange: string
  id: string
  idOfLastSignal?: number
  status?: number
  streamPrivate?: StreamPrivate
  lastSignal?: Signal
}