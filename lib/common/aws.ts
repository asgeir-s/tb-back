import * as AWS from "aws-sdk"
import * as Promise from "bluebird"
import * as _ from "ramda"

export module DynamoDb {
  export function documentClientAsync(region: string): any {
    const documentClient = new AWS.DynamoDB.DocumentClient({
      "region": region
    })
    Promise.promisifyAll(Object.getPrototypeOf(documentClient))
    return documentClient
  }


  export function storeKeyValue(documentclient: any, storageTable: string,
    itemId: string, keyValue: Array<Array<any>>): Promise<any> {

    return documentclient.putAsync({
      TableName: storageTable,
      Item: _.reduce((obj: any, item: Array<any>) => _.assoc(item[0], item[1], obj), { "id": itemId }, keyValue)
    })
  }


  export function addItem(documentclient: any, tableName: string, primaryKey: string, item: any):
    Promise<any> {
    return documentclient.putAsync({
      "TableName": tableName,
      "Item": item
    })
  }

  export function addItemNoReplace(documentclient: any, tableName: string, primaryKey: string, item: any):
    Promise<any> {
    return documentclient.putAsync({
      "TableName": tableName,
      "Item": item,
      "ConditionExpression": "attribute_not_exists(" + primaryKey + ")"
    })
  }

  /**
   * Returns full item
   */
  export function getItem(documentclient: any, tableName: string, primaryKey: any):
    Promise<any> {
    return documentclient.getAsync({
      "TableName": tableName,
      "Key": primaryKey
    }).then((res: any) => res.Item)
  }

  /**
   * Returns specifyed attributes
   */
  export function getItemWithAttrebutes(documentclient: any, tableName: string, primaryKey: any,
    attributesToGet: Array<string>): Promise<any> {
    return documentclient.getAsync({
      "TableName": tableName,
      "Key": primaryKey,
      "AttributesToGet": attributesToGet
    }).then((res: any) => res.Item)
  }

  /**
   * Update the attributes of an item.
   * 
   * attributeUpdates example: 
   * 
   *  {
   *    someKey: {
   *      Action: 'ADD | PUT | DELETE',
   *      Value: someValue // "str" | 10 | true | false | null | [1, "a"] | {a: "b"} 
   *    },
   *    // anotherKey: ... 
   *  }
   */
  export function updateAttributes(documentclient: any, tableName: string, primaryKey: any, attributeUpdates: any):
    Promise<any> {
    return documentclient.updateAsync({
      "TableName": tableName,
      "Key": primaryKey,
      "AttributeUpdates": attributeUpdates
    })
  }

}

export module SES {
  export function sesClientAsync(region: string): any {
    const sesClient = new AWS.SES({
      apiVersion: "2010-12-01",
      region: region
    })
    Promise.promisifyAll(Object.getPrototypeOf(sesClient))
    return sesClient
  }

  export interface Email {
    subject: string,
    body: string,
    resipians: Array<string>
  }

  export function send(sesClient: any, fromEmail: string, email: Email): Promise<any> {
    return sesClient.sendEmailAsync({
      Destination: {
        ToAddresses: email.resipians
      },
      Message: {
        Body: {
          Html: {
            Data: email.body,
            Charset: "UTF-8"
          }
        },
        Subject: {
          Data: email.subject,
          Charset: "UTF-8"
        }
      },
      Source: fromEmail
    })
  }
}

export module SNS {
  export function snsClientAsync(region: string): any {
    const snsClient = new AWS.SNS({
      apiVersion: "2010-03-31",
      region: region
    })
    Promise.promisifyAll(Object.getPrototypeOf(snsClient))
    return snsClient
  }

  export interface Responds {
    ResponseMetadata: { RequestId: string },
    MessageId: string
  }

  export function publish(snsClient: any, topicArn: string, message: any): Promise<Responds> {
    return snsClient.publishAsync({
      Message: JSON.stringify(message),
      TopicArn: topicArn
    })
  }

  /**
   * OBS: spesify stage ("dev") like this example:
   *  lambdaArn: "arn:aws:lambda:us-west-2:525932482084:function:test-func:dev"
   *  statmentId: new Date().getTime().toString()
   *  testTopic: "arn:aws:sns:us-west-2:525932482084:test-topic"
   * 
   * Returns SubscriptionArn
   */
  export function subscribeLambda(snsClient: any, lambdaClient: any, topicArn: string, lambdaArn: string):
    Promise<string> {
    return snsClient.subscribeAsync({
      Protocol: "lambda",
      TopicArn: topicArn,
      Endpoint: lambdaArn
    })
      .then((res: any) => {

        /**
         * makes a statementId that is maximun 100 in length
         */
        function createStatmentId(topicArnRaw: string, lambdaArnRaw: string) {
          let topicArn = topicArnRaw.split(":").join("")
          let lambdaArn = lambdaArnRaw.split(":").join("")

          if (topicArn.length > 50) {
            const start = topicArn.length - 50
            topicArn = topicArn.substr(start, 50)
          }

          if (lambdaArn.length > 50) {
            const start = lambdaArn.length - 50
            lambdaArn = lambdaArn.substr(start, 50)
          }

          return topicArn + lambdaArn
        }
        const arnParts = lambdaArn.split(":")
        const statementId = createStatmentId(topicArn, lambdaArn)

        const prop: any = {
          Action: "lambda:InvokeFunction",
          FunctionName: arnParts[6],
          Principal: "sns.amazonaws.com",
          StatementId: statementId
        }

        if (arnParts.length === 8) {
          prop["Qualifier"] = arnParts[7]
        }

        return lambdaClient.addPermissionAsync2(prop)
          .then((lambdaRes: any) => res.SubscriptionArn)
          .catch((e: Error) => (e.name.indexOf("ResourceConflictException") > -1), (error: any) => {
            console.log("The permission already exists: (ResourceConflictException). Subscription was added with " +
              "SubscriptionArn:" + res.SubscriptionArn)
            return res.SubscriptionArn
          })
      })
  }

  export function unsubscribe(snsClient: any, subscriptionArn: string): Promise<any> {
    return snsClient.unsubscribeAsync({
      "SubscriptionArn": subscriptionArn
    })
  }
}


export module Lambda {
  export function lambdaClientAsync(region: string): any {
    const lambdaClient = new (AWS as any).Lambda({
      apiVersion: "2015-03-31",
      region: region
    })
    Promise.promisifyAll(Object.getPrototypeOf(lambdaClient), { suffix: "Async2" })
    return lambdaClient
  }
}