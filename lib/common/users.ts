import * as Promise from "bluebird"
import * as request from "request"

import { Stream } from "./typings/stream"

const requestAsync = Promise.promisify(request)

export module Users {
/**
 * fields: should be a comaseperated string. "email,name,test"
 */
  export function getUser(auth0GetUserSecret: string, fields: string, userId: string): Promise<string> {
    return requestAsync({
      method: "GET",
      uri: "https://cluda.auth0.com/api/v2/users/" + userId + "?fields=" + fields,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + auth0GetUserSecret
      },
      json: true
    }).then((res: any) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        throw new Error("Failed to get user-email from Auth0 .Responds from Auth0: " + JSON.stringify(res))
      }
      else {
        return res.body.email
      }
    })
  }

}