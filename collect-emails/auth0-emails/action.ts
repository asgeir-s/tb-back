import * as _ from "ramda"
import * as Promise from "bluebird"

import { Responds } from "../../lib/common/typings/responds"
import { Context } from "../../lib/common/typings/aws-lambda"
import { log } from "../../lib/logger"

export module CollectAuth0Emails {

  export interface Inject {
    load: (attributes: Array<string>) => Promise<any>
    save: (items: Array<Array<any>>) => Promise<any>
    getNewAuth0Emails: (numberOfAlreadyCollectedEmails: number) => Promise<Array<string>>
    addEmailsToMailchimp: (emails: Array<string>) => Promise<any>
  }

  export function action(inn: Inject, event: any, context: Context): Promise<Responds> {

    return inn.load(["numberOfCollectedEmails"])
      .then(res => {
        log.info("data loaded from storage", res)
        return [res.numberOfCollectedEmails, inn.getNewAuth0Emails(res.numberOfCollectedEmails)]
      })
      .spread<[number, any]>((numberOfCollectedEmails: number, newEmails: Array<string>) => {
        log.info("Got new emails", { "numberOfNewEmails": newEmails.length })
        return [numberOfCollectedEmails + newEmails.length, inn.addEmailsToMailchimp(newEmails)]
      })
      .spread<[number, any]>((totalNumberOfEmails: number, res: any) => {
        log.info("Responds from Mailchimp", res)
        return [totalNumberOfEmails, inn.save([["numberOfCollectedEmails", totalNumberOfEmails]])]
      })
      .spread<Responds>((totalNumberOfEmails: number, res: any) => {
        return {
          "GRID": context.awsRequestId,
          "data": {
            "savedTotalNumberOfEmails": totalNumberOfEmails,
            "saveRes": res
          },
          "success": true
        }
      })
  }
}
