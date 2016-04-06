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

  export function getClosedSignals(signalServiceUrl: string, signalServiceApiKey: string,
    GRID: string, streamId: string): Promise<Array<Signal>> {
    return requestAsync({
      method: "GET",
      uri: signalServiceUrl + "/streams/" + streamId + "/signals?onlyClosed=true",
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

  /**
   * Returns the created signal (with all 'Signal' attributes)
   */
  export function postSignal(signalServiceUrl: string, signalServiceApiKey: string, GRID: string,
    streamId: string, signal: number): Promise<Array<Signal>> {
    return requestAsync({
      method: "POST",
      uri: signalServiceUrl + "/streams/" + streamId + "/signals",
      headers: {
        "Global-Request-ID": GRID,
        "content-type": "application/json",
        "Authorization": "apikey " + signalServiceApiKey
      },
      body: signal,
      json: true
    }).then((res: any) => {
      if (res.statusCode === 409) {
        throw new Error("duplicate")
      }
      else if (res.statusCode < 200 || res.statusCode >= 300) {
        throw new Error(res.body)
      }
      else {
        return res.body
      }
    })

  }
}
