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
    .then(result => {
      if (result.success) {
        log.log("RESULT", "SUCCESS", { "result": result })
        context.done(null, result)
      }
      else {
        log.log("RESULT", "FAILE", { "result": result })
        context.done(result, null)
      }
    })
    .catch((error: any) => {
      log.log("RESULT", "EXCEPTION", {
        "exceptionName": error.name,
        "exceptionMessage": error.message,
        "stack": error.stack
      })
      return context.done({
        "GRID": context.awsRequestId,
        "data": "Internal Server Error",
        "success": false
      }, null)
    })
}


