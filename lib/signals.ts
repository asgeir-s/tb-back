import * as Promise from "bluebird"
import * as request from "request"

import { Signal } from "./typings/signal"

const requestAsync = Promise.promisify(request)

export module Signals {

  export function getSignalsBefore(signalServiceUrl: string, signalServiceApiKey: string,
    beforeTime: number, GRID: string, streamId: string): Promise<Array<Signal>> {
    return requestAsync({
      method: "GET",
      uri: signalServiceUrl + "/streams/" + streamId + "/signals?beforeTime=" + beforeTime,
      headers: {
        "Global-Request-ID": GRID,
        "content-type": "application/json",
        "Authorization": "apikey " + signalServiceApiKey
      },
      json: true
    }).then((res: any) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        throw new Error(res.body)
      }
      else {
        return res.body
      }
    })
  }
}
