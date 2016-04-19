import * as _ from "ramda"
import * as Promise from "bluebird"

import { DynamoDb, SES } from "../../lib/common/aws"
import { Auth0 } from "../../lib/common/auth0"
import { Mailchimp } from "../../lib/mailchimp"
import { Context } from "../../lib/common/typings/aws-lambda"
import { CollectAuth0Emails } from "./action"
import { Subscriptions } from "../../lib/subscriptions"
import { handle } from "../../lib/handler"
import { Streams } from "../../lib/common/streams"
import { Coinbase } from "../../lib/coinbase"
import { Crypto } from "../../lib/common/crypto"


const documentClient = DynamoDb.documentClientAsync(process.env.AWS_DYNAMO_REGION)

const inject: CollectAuth0Emails.Inject = {
  load:
  _.curry(DynamoDb.load)(documentClient, process.env.AWS_STORAGE_TABLE, "tb-backend-CollectAuth0Emails"),
  save:
  _.curry(DynamoDb.save)(documentClient, process.env.AWS_STORAGE_TABLE, "tb-backend-CollectAuth0Emails"),
  getNewAuth0Emails: _.curry(Auth0.getNewUserEmailsExcept)(process.env.AUTH0_URL, process.env.AUTH0_READUSER_JWT),
  addEmailsToMailchimp: _.curry(Mailchimp.subscribeEmails)(process.env.MAILCHIMP_URL, process.env.MAILCHIMP_APIKEY)
}

export function handler(event: any, context: Context) {
  handle(CollectAuth0Emails.action, inject, event, context)
}