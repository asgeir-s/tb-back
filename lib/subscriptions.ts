import * as Promise from "bluebird"

import { Subscription } from "./common/typings/subscription"

export interface AddSubscriptionResponds {
  streamId: string
  expirationTime: number,
  new: boolean
}

export module Subscriptions {

  export function getActiveSubscriptions(documentClient: any, subscriptionTable: string,
    streamId: string, time: number): Promise<Array<Subscription>> {

    return documentClient.queryAsync({
      TableName: subscriptionTable,
      KeyConditionExpression: "streamId = :streamId AND expirationTime >= :timeNow",
      FilterExpression: "attribute_not_exists (renewed) OR renewed = :false",
      ExpressionAttributeValues: {
        ":streamId": streamId,
        ":timeNow": time,
        ":false": false
      }
    }).then((responds: any) => responds.Items)
  }

  export function getActiveAutotraderSubscriptions(documentClient: any, subscriptionTable: string,
    streamId: string, time: number): Promise<Array<Subscription>> {

    return documentClient.queryAsync({
      TableName: subscriptionTable,
      KeyConditionExpression: "streamId = :streamId AND expirationTime >= :timeNow",
      FilterExpression: "autoTrader = :true AND (attribute_not_exists (renewed) OR renewed = :false)",
      ExpressionAttributeValues: {
        ":streamId": streamId,
        ":timeNow": time,
        ":false": false,
        ":true": true
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
      FilterExpression: "expirationTime BETWEEN :from_time AND :to_time",
      ExpressionAttributeValues: {
        ":from_time": fromTime,
        ":to_time": toTime,
      }
    }).then((responds: any) => responds.Items)
  }

  /**
   * 
   * 1. checks stream with that orderId does not exists
   * 2. can not owerwrite
   * 
   * returns the streamId and expirationTime for the subscription
   * OBS: and the new attribute wheter the subscription was added now or excisted from before
   */
  export function addSubscription(documentClient: any, subscriptionTable: string,
    subscription: Subscription): Promise<AddSubscriptionResponds> {

    return documentClient.queryAsync({
      TableName: subscriptionTable,
      IndexName: "orderId-index",
      KeyConditionExpression: "orderId = :orderId",
      ExpressionAttributeValues: {
        ":orderId": subscription.orderId
      }
    })
      .then((res: any) => {
        // this subscription does not existe
        if (res.Count === 0) {
          return documentClient.putAsync({
            TableName: subscriptionTable,
            Item: subscription,
            ConditionExpression: "attribute_not_exists(streamId) AND attribute_not_exists(expirationTime)"
          })
            .then((res: any) => {
              return {
                "streamId": subscription.streamId,
                "expirationTime": subscription.expirationTime,
                "new": true
              }
            })
        }
        // the subscription already exists
        else {
          return {
            "streamId": res.Items[0].streamId,
            "expirationTime": res.Items[0].expirationTime,
            "new": false
          }
        }
      })

  }

  export function updateAutoTraderData(documentClient: any, subscriptionTable: string,
    streamId: string, subscriptionExpirationTime: number, newAutoTraderData: any): Promise<any> {
    return documentClient.updateAsync({
      TableName: subscriptionTable,
      Key: {
        "streamId": streamId,
        "expirationTime": subscriptionExpirationTime
      },
      UpdateExpression: "set autoTraderData=:newAutoTraderData",
      ExpressionAttributeValues: {
        ":newAutoTraderData": newAutoTraderData
      }
    })
  }

// for inactivating a subscription
  export function markSubscriptionRenewed(documentClient: any, subscriptionTable: string,
    streamId: string, subscriptionExpirationTime: number): Promise<any> {
    return documentClient.updateAsync({
      TableName: subscriptionTable,
      Key: {
        "streamId": streamId,
        "expirationTime": subscriptionExpirationTime
      },
      UpdateExpression: "set renewed=:trueval",
      ExpressionAttributeValues: {
        ":trueval": true
      }
    })
  }
}