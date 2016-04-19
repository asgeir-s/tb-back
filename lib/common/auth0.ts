import * as Promise from "bluebird"
import * as request from "request"
import * as _ from "ramda"

const requestAsync = Promise.promisify(request)

export module Auth0 {

  export function getUserInfo(auth0Url: string, auth0Jwt: string, userId: string, fields: string):
    Promise<any> {
    return requestAsync({
      method: "GET",
      uri: auth0Url + "/api/v2/users/" + userId + "?fields=" + fields + "&include_fields=true",
      headers: {
        "Authorization": "Bearer " + auth0Jwt,
        "content-type": "application/json"
      },
      json: true
    })
      .then((res: any) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          throw new Error(res)
        }
        else {
          return res.body
        }
      })
  }

  export function checkUserAppMetadataUptodate(auth0Url: string, auth0Jwt: string, userId: string, appMetadata: any):
    Promise<boolean> {
    return getUserInfo(auth0Url, auth0Jwt, userId, "app_metadata")
      .then(userData => _.equals(userData.app_metadata, appMetadata) ? true : false)
  }

  export function addStreamToAuth0UserReturnAppData(auth0Url: string, auth0Jwt: string, userId: string,
    streamId: string): Promise<any> {
    return addStreamToUserAppMetadataAtAuth0(auth0Url, auth0Jwt, userId, streamId)
      .then(result => result.app_metadata)
  }

  /**
   * Get all users except the "numberOfUsersToSkip" first created users.
   * 
   * fields: is a commaseperated list of the fields to retreive
   */
  export function getNewUserEmailsExcept(auth0Url: string, auth0Jwt: string, numberOfUsersToSkip: number):
    Promise<Array<any>> {

    interface Auth0Responds {
      start: number
      limit: number
      length: number
      total: number
      users: Array<any>
    }

    return loop(0, [])

    function loop(page: number, newEmails: Array<string>): Promise<Array<string>> {
      return new Promise<Array<string>>((resolve, reject) => {
        getEmails(page)
          .then(res => {
            _.map((user => {
              if (newEmails.length + numberOfUsersToSkip === res.total) {
                // done
                return newEmails
              }
              else {
                newEmails.push(user.email)
              }
            }), res.users)

            return [res.total, newEmails]
          })
          .spread((totalUsers: number, newEmails: Array<string>) => {
            if (newEmails.length + numberOfUsersToSkip === totalUsers) {
              // done
              return resolve(newEmails)
            }
            else {
              return resolve(loop(page + 1, newEmails))
            }
          })
      })

    }

    function getEmails(page: number): Promise<Auth0Responds> {
      return requestAsync({
        method: "GET",
        uri: auth0Url + "/api/v2/users?per_page=100&page=" + page + "&include_totals=true&sort=created_at%3A-1&" +
        "fields=email&include_fields=true&search_engine=v2",
        headers: {
          "Authorization": "Bearer " + auth0Jwt,
          "content-type": "application/json"
        },
        json: true
      })
        .then((res: any) => {
          console.log("res: " + JSON.stringify(res))

          if (res.statusCode === 200) {
            return res.body
          }
          else {
            throw new Error(res)
          }
        })
    }

  }

  function addStreamToUserAppMetadataAtAuth0(auth0Url: string, auth0Jwt: string,
    userId: string, streamId: string): Promise<any> {
    const newStreamKey = "stream-" + (new Date).getTime()

    let requestAppMetadata: any = {}
    requestAppMetadata[newStreamKey] = streamId

    return requestAsync({
      method: "PATCH",
      uri: auth0Url + "/api/v2/users/" + userId,
      headers: {
        "Authorization": "Bearer " + auth0Jwt,
        "content-type": "application/json"
      },
      body: { "app_metadata": requestAppMetadata },
      json: true
    })
      .then((res: any) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          throw new Error(res.body)
        }
        else {
          return res.body
        }
      })
  }

}
