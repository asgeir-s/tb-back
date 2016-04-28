import * as test from "tape"
import { DynamoDb, SES, SNS, Lambda } from "./aws"
import * as _ from "ramda"
import * as sinon from "sinon"


test("DynamoDb:", (ot) => {
  ot.plan(4)

  const databaseCli = DynamoDb.documentClientAsync("us-west-2")
  const load = _.curry(DynamoDb.getItemWithAttrebutes)(databaseCli, "storage-test", { "id": "test-id" })
  const save = _.curry(DynamoDb.storeKeyValue)(databaseCli, "storage-test", "test-id")
  const timestamp = new Date().getTime()

  ot.test("- should be able to save and load tings", t => {
    t.plan(1)

    load(["id", "ting"])
      .then(_.prop("ting"))
      .then((ting: string) =>
        t.equal(ting, "hus", "should be possible to load a spesific attribute")
      )
  })

  ot.test("- should be possible to save new things and load them back", t => {
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

  ot.test("- should not be able to add new item with the same id (.addItemNoReplace)", t => {
    t.plan(1)

    DynamoDb.addItemNoReplace(databaseCli, "storage-test", "id", {
      "id": "test-id",
      "data": "test"
    })
      .then(okRes => {
        t.equal(1, 2, "should not be ok")
      })
      .catch(errRes => {
        t.equal(1, 1, "should fail")
      })
  })

  ot.test("- should be able to update attributes on an item (.updateAttributes)", t => {
    t.plan(1)

    DynamoDb.updateAttributes(databaseCli, "storage-test", { "id": "test-id" }, {
      "testUpdateAttribute": {
        "Action": "PUT",
        "Value": {
          "message": "mat test",
          "time": timestamp
        }
      }
    })
      .then(updateAttributesRes => {
        load(["testUpdateAttribute"])
          .then(res => {
            t.equal(res.testUpdateAttribute.time, timestamp, "the time should be updated, with the new timestamp")
          })
      })
  })
})

test("SES: should send email", t => {
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


test("SNS: should succesfulle publish message to topic", t => {
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

test("SNS: should succesfulle subscribe a lambda to a SNS topic (but not adde premissions if already added)", t => {
  t.plan(1)

  const testTopic = "arn:aws:sns:us-west-2:525932482084:test-topic"
  const snsCli = SNS.snsClientAsync("us-west-2")
  const lambdaCli = Lambda.lambdaClientAsync("us-west-2")
  const lambdaArn = "arn:aws:lambda:us-west-2:525932482084:function:test-func-2"

  SNS.subscribeLambda(snsCli, lambdaCli, testTopic, lambdaArn)
    .then(subscriptionArn => {
      t.equal(1, 1, "should succssed")
    })

})