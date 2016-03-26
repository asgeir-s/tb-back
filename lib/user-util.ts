import * as Promise from 'bluebird'
import * as request from 'request'

import { Stream } from './typings/stream'

const requestAsync = Promise.promisify(request)

export module UserUtil {

  export function getUserEmail(auth0GetUserSecret: string, GRID: string, userId: string): Promise<string> {
    return requestAsync({
      method: 'GET',
      uri: 'https://cluda.auth0.com/api/v2/users/' + userId + '?fields=email',
      headers: {
        "Global-Request-ID": GRID,
        'Content-Type': 'application/json',
        "Authorization": "Bearer " + auth0GetUserSecret
      },
      json: true
    }).then((res: any) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        throw new Error('Failed to get user-email from Auth0 .Responds from Auth0: ' + res)
      }
      else {
        return res.body.email
      }
    })
  }

}