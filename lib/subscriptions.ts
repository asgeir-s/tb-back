import * as Promise from 'bluebird'
import { Subscription } from './typings/subscription'

export module Subscriptions {

  export function getActiveSubscriptions(documentClient: any, subscriptionTable: string,
    streamId: string, time: number): Promise<Array<Subscription>> {

    return documentClient.queryAsync({
      TableName: subscriptionTable,
      KeyConditionExpression: 'streamId = :streamId AND expirationTime >= :timeNow',
      FilterExpression: '(attribute_not_exists (renewed) OR renewed = :falseString)',
      ExpressionAttributeValues: {
        ':streamId': streamId,
        ':timeNow': time,
        ':falseString': 'false',
      }
    }).then((responds: any) => responds.Items)
  }

  export function getActiveAutotraderSubscriptions(documentClient: any, subscriptionTable: string,
    streamId: string, time: number): Promise<Array<Subscription>> {

    return documentClient.queryAsync({
      TableName: subscriptionTable,
      KeyConditionExpression: 'streamId = :streamId AND expirationTime >= :timeNow',
      FilterExpression: 'autoTrader = :trueString AND (attribute_not_exists (renewed) OR renewed = :falseString)',
      ExpressionAttributeValues: {
        ':streamId': streamId,
        ':timeNow': time,
        ':falseString': 'false',
        ':trueString': 'true'
      }
    }).then((responds: any) => responds.Items)
  }

  /** 
   * Returns subscriptions from (inclusive) start too (inclusive) end time in ms 
   */
  export function getExpieringSubscriptions(documentClient: any, subscriptionTable: string,
    fromTime: number, toTime: number): Promise<Array<Subscription>> {

    return documentClient.scanAsync({
      TableName: subscriptionTable,
      FilterExpression: 'expirationTime BETWEEN :from_time AND :to_time',
      ExpressionAttributeValues: {
        ':from_time': fromTime,
        ':to_time': toTime,
      }
    }).then((responds: any) => responds.Items)
  }
}