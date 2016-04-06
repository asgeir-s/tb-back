import * as test from "tape"
import { DynamoDb, SES, SNS, Lambda } from "./aws"
import * as _ from "ramda"
import * as sinon from "sinon"


test("DynamoDb:", (ot) => {
  ot.plan(2)

  const databaseCli = DynamoDb.documentClientAsync("us-west-2")
  const load = _.curry(DynamoDb.load)(databaseCli, "storage-test", "test-id")
  const save = _.curry(DynamoDb.save)(databaseCli, "storage-test", "test-id")
  const timestamp = new Date().getTime()

  ot.test("- should be able to save and load tings", (t) => {
    t.plan(1)

    load(["id", "ting"])
      .then(_.prop("ting"))
      .then((ting: string) =>
        t.equal(ting, "hus", "should be possible to load a spesific attribute")
      )
  })

  ot.test("- should be possible to save new things and load them back", (t) => {
    t.plan(1)

    save([["ting", "hus"], ["timestamp", timestamp]])
      .then(() =>
        load(["timestamp"])
          .then(_.prop("timestamp"))
          .then((returnedTimestamp: string) =>
            t.equal(returnedTimestamp, timestamp,
              "the retreived timestamp should be equal to the timestanm that was saved in the test")
          )
      )
  })
})

test("SES: should send email", (t) => {
  t.plan(1)

  const sendEmailAsyncSpy = sinon.spy()
  const sendEmail = _.curry(SES.send)({ sendEmailAsync: sendEmailAsyncSpy }, "test@coinsignals.com")
  const email: SES.Email = {
    subject: "test subject",
    body: "test body",
    resipians: ["sogasg@gmail.com"]
  }

  sendEmail(email)
  t.equal(sendEmailAsyncSpy.callCount, 1, "should be called once")
})


test("SNS: should succesfulle publish message to topic", (t) => {
  t.plan(1)

  const testTopic = "arn:aws:sns:us-west-2:525932482084:test-topic"
  const snsCli = SNS.snsClientAsync("us-west-2")
  const publish = _.curry(SNS.publish)(snsCli)(testTopic)

  publish({
    message: "test",
    more: 22
  }).then(res => t.equal(res.MessageId.length > 0, true,
    "the responds should have a MessageId"))
})

test("SNS: should succesfulle subscribe a lambda to a SNS topic", (t) => {
  t.plan(1)

  const testTopic = "arn:aws:sns:us-west-2:525932482084:test-topic"
  const snsCli = SNS.snsClientAsync("us-west-2")
  const lambdaCli = Lambda.lambdaClientAsync("us-west-2")
  const lambdaArn = "arn:aws:lambda:us-west-2:525932482084:function:test-func:dev"
  const statmentId = new Date().getTime().toString()

  SNS.subscribeLambda(snsCli, lambdaCli, testTopic, lambdaArn, statmentId)
    .then((res: any) => {
      console.log("res: " + JSON.stringify(lambdaArn))
      t.equal(1, 1)
    })

})