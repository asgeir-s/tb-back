import * as test from "tape"
import * as _ from "ramda"
import * as Promise from "bluebird"
import * as sinon from "sinon"

import { NotifyEmail, Inject } from "./action"
import { Subscriptions } from "../../lib/subscriptions"
import { SES, DynamoDb } from "../../lib/aws"
import { Context } from "../../lib/typings/aws-lambda"

const event = require("./event.json")

test("NotifyEmail:", (ot) => {
  ot.plan(2)

  ot.test("- should send emails", (t) => {
    t.plan(3)

    const inject: Inject = {
      getActiveSubscriptions: (s, t) => Promise.resolve(
        Array(
          Promise.resolve({ email: "test@msn.com" }),
          Promise.resolve({ email: "test2@msn.com" })
        )
      ),
      sendEmail: (email: SES.Email) => Promise.resolve("email sent"),
      timeNow: () => 12345766876
    }

    const sendEmailSpy = sinon.spy(inject, "sendEmail")

    NotifyEmail.action(inject, event, <Context>{ awsRequestId: "test-request" })
      .then((result: any) => {
        t.equal(result.success, true, "should return success")
        t.equal(result.data, "email sent")
        t.equal(sendEmailSpy.callCount, 1)
      })
  })

  ot.test("- should be successful but not send emails when their is no subscribers", (t) => {
    t.plan(3)

    const inject: Inject = {
      getActiveSubscriptions: (s, t) => Promise.resolve(Array()),
      sendEmail: (email: SES.Email) => Promise.resolve("email sent"),
      timeNow: () => 12345766876
    }

    const sendEmailSpy = sinon.spy(inject, "sendEmail")

    NotifyEmail.action(inject, event, <Context>{ awsRequestId: "test-request" })
      .then((result: any) => {
        t.equal(result.success, true, "should return success")
        t.equal(result.data, "no active email subscribers")
        t.equal(sendEmailSpy.callCount, 0)
      })
  })

})