import * as Promise from "bluebird"
import * as request from "request"
import * as _ from "ramda"

const requestAsync = Promise.promisify(request)

export module Mailchimp {

  export function subscribeEmails(mailchimpUrl: string, mailchimpApikey: string, emails: Array<string>):
    Promise<any> {

    const operations: Array<any> = emails.map(email => {
      return {
        "method": "POST",
        "path": "lists/8c6fade340/members",
        "body": JSON.stringify({
          "email_address": email,
          "status": "subscribed"
        })
      }
    })

    return requestAsync({
      "method": "POST",
      "auth": {
        "user": "anyBla",
        "pass": mailchimpApikey,
        "sendImmediately": true
      },
      "uri": mailchimpUrl + "/3.0/batches",
      "headers": {
        "content-type": "application/json"
      },
      "body": {
        "operations": operations
      },
      "json": true
    })
      .then((res: any) => {
        console.log("Mailchimp res: " + JSON.stringify(res))

        if (res.statusCode === 200) {
          return res.body
        }
        else {
          throw new Error(res)
        }
      })
  }
}