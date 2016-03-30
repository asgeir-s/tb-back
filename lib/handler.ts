import { Context } from "./typings/aws-lambda"
import { Responds } from "./typings/responds"


export function handle(
  action: (inject: any, event: any, context: Context) => Promise<Responds>,
  inject: any,
  event: any,
  context: Context) {

  console.log("[" + context.awsRequestId + "] EVENT: " + JSON.stringify(event))

  action(inject, event, context)
    .then(result => {
      if (result.success) {
        console.info("[" + context.awsRequestId + "] RESULT-SUCCESS: " + JSON.stringify(result))
        context.done(null, result)
      }
      else {
        console.info("[" + context.awsRequestId + "] RESULT-FAILE: " + JSON.stringify(result))
        context.done(result, null)
      }
    })
    .catch((error: any) => {
      console.error("[" + context.awsRequestId + "] RESULT-EXCEPTION: " + error)
      return context.done({
        "GRID": context.awsRequestId,
        "data": "Internal Server Error",
        "success": false
      }, null)
    })
}


