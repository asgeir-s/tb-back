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

  export function load(documentclient: any, storageTable: string,
    id: string, attributes: Array<string>): Promise<any> {

    return documentclient.getAsync({
      TableName: storageTable,
      Key: { "id": id },
      AttributesToGet: attributes
    }).then((res: any) => res.Item)
  }

  export function save(documentclient: any, storageTable: string,
    id: string, items: Array<Array<any>>): Promise<any> {

    return documentclient.putAsync({
      TableName: storageTable,
      Item: _.reduce((obj: any, item: Array<any>) => _.assoc(item[0], item[1], obj), { "id": id }, items)
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
   */
  export function subscribeLambda(snsClient: any, lambdaClient: any, topicArn: string, lambdaArn: string,
    statementId: string): Promise<any> {
    return snsClient.subscribeAsync({
      Protocol: "lambda",
      TopicArn: topicArn,
      Endpoint: lambdaArn
    })
      .then((res: any) => {
        const arnParts = lambdaArn.split(":")
        if (arnParts.length === 8) {
          return lambdaClient.addPermissionAsync2({
            Action: "lambda:InvokeFunction",
            FunctionName: arnParts[6],
            Principal: "sns.amazonaws.com",
            StatementId: statementId,
            Qualifier: arnParts[7]
          })
        }
        else if (arnParts.length === 7) {
          return lambdaClient.addPermissionAsync2({
            Action: "lambda:InvokeFunction",
            FunctionName: arnParts[6],
            Principal: "sns.amazonaws.com",
            StatementId: statementId
          })
        }
        else {
          return "unable to parse arn. Arn length should be 8 or 7"
        }

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