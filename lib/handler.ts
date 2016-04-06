import * as Promise from "bluebird"

import { Context } from "./common/typings/aws-lambda"
import { Responds } from "./common/typings/responds"
import { log } from "../lib/logger"

export function handle(
  action: (inject: any, event: any, context: Context) => Promise<Responds>,
  inject: any,
  event: any,
  context: Context,
  printEvent: boolean = true) {

  if (printEvent) {
    log.log("EVENT", "received new event", { "event": event })
  }

  action(inject, event, context)
    .catch((error: Error) => {
      log.exception("unknow exception", error)
      return {
        "GRID": context.awsRequestId,
        "statusCode": 500,
        "data": "internal server error",
        "success": false
      }
    })
    .then(result => {
      if (result.success) {
        log.log("RESULT", "SUCCESS: returning result", {
          "GRID": result.GRID,
          "data": result.data instanceof Array ? {
            "truncatedData": result.data.slice(0, 3),
            "originalLength": result.data.length
          } : result.data,
          "success": result.success
        })
        context.done(null, result)
      }
      else {
        const statusCode = result.statusCode ? result.statusCode : 500
        log.log("RESULT", "FAILURE: returning result", {
          "GRID": result.GRID,
          "data": result.data,
          "success": result.success,
          "statusCode": statusCode
        })
        context.done("[" + statusCode + "] " + result.data + ". When contacting support please provide this id: " +
          result.GRID, null)
      }
    })
}


