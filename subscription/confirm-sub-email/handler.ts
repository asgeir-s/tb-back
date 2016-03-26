
import { ConfirmSubscriptionEmail } from './action'
import { Context } from '../../lib/typings/aws-lambda'


export function handler(event: any, context: Context) {
  ConfirmSubscriptionEmail.action(event, context)
    .then((result: any) => context.done(null, result))
    .catch((error: any) => {
      console.error('error [' + context.awsRequestId + '] ' + error)
      return context.done({
        GRID: context.awsRequestId,
        message: 'Internal Server Error',
        success: false
      }, null)
    })
}