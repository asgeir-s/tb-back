import * as AWS from 'aws-sdk'
import * as Promise from 'bluebird'
import * as _ from 'ramda'

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
      apiVersion: '2010-12-01',
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
            Charset: 'UTF-8'
          }
        },
        Subject: {
          Data: email.subject,
          Charset: 'UTF-8'
        }
      },
      Source: fromEmail
    })
  }
}

export module SNS {
  export function snsClientAsync(region: string): any {
    const snsClient = new AWS.SNS({
      apiVersion: '2010-03-31',
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
    
    console.log('sns: ' + JSON.stringify(message));
    
    
    return snsClient.publishAsync({
      Message: JSON.stringify(message),
      TopicArn: topicArn
    })
  }
}