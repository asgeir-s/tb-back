import * as test from "tape"
import * as Promise from "bluebird"
import * as sinon from "sinon"
import { Context } from "../../lib/common/typings/aws-lambda"
import { StateRecorder } from "./action"

test("StateRecorder:", (ot) => {
  ot.plan(1)

  ot.test("- should execute order when position is CLOSED and requested position is LONG", (t) => {
    t.plan(3)

    const message = {
      "streamName": "gie89",
      "streamId": "0a9ea22b-5d62-4951-be3b-bf619ab6411d",
      "signals": [{
        "timestamp": 1455104851968,
        "price": 378.6200,
        "change": 0E-10,
        "id": 3,
        "valueInclFee": 1.0040283877,
        "changeInclFee": -0.0020000000,
        "value": 1.0080404686,
        "signal": 0
      }, {
          "timestamp": 1455504851968,
          "price": 398.6200,
          "change": 0E-10,
          "id": 4,
          "valueInclFee": 1.0040283877,
          "changeInclFee": -0.0020000000,
          "value": 1.0080404686,
          "signal": -1
        }]
    }

    const inn = {
      setRecordedData: (item: any) => {
        t.deepEqual(item.signal, message.signals[0], "should save/store the correct signal")
        return Promise.resolve({
          "item": "item"
        })
      },
      getRecordedData: (key: any) => {
        t.equal(key.streamId, message.streamId, "should get recorded date for the correct stream")
        return Promise.resolve({
          "subscriptionArn": "test-sub-arn"
        })
      },
      snsUnsubscribe: (subscriptionArn: string) => {
        t.equal(subscriptionArn, "test-sub-arn", "should unsubscribe the correct subscriptionArn")
        return Promise.resolve({
          "unsubscribedArn": "test-sub-arn"
        })
      }
    }

    StateRecorder.action(inn as StateRecorder.Inject, message, { awsRequestId: "test-request" } as Context)
      .then(res => console.log("res:" + JSON.stringify(res))
      )

  })

})

