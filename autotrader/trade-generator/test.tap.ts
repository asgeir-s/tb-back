import * as test from "tape"
import * as Promise from "bluebird"
import * as sinon from "sinon"
import { Context } from "../../lib/typings/aws-lambda"
import { TradeGenerator, Inject } from "./action"
import { SNS } from "../../lib/aws"

const event = require("./event.json")

test("Trade-Generator:", (ot) => {
  ot.plan(3)

  ot.test("- should publish trads successfully for 2 subscribers", (t) => {
    t.plan(5)

    const inn: Inject = {
      getSubscriptions: (streamId: string, timeNow: number) =>
        Promise.resolve(
          Array(
            Promise.resolve({ subscription: 1 }),
            Promise.resolve({ subscription: 2 })
          )
        ),
      snsPublish: (message: any) => <any>Promise.resolve({
        ResponseMetadata: { RequestId: "test-RequestId" },
        MessageId: "test-MessageId"
      }),
      timeNow: () => 12345766876
    }

    const spyGetSubscriptions = sinon.spy(inn, "getSubscriptions")
    const spySnsPublish = sinon.spy(inn, "snsPublish")

    TradeGenerator.action(inn, event, <Context>{ awsRequestId: "test-grid" }).then(x => {
      t.equal(x.GRID, "test-grid", "should return the correct GRID")
      t.equal(x.data, "published trade for 2 subscribers", "the trade should be published to two subscribers")
      t.equal(x.success, true, "the respondse should be a success")
      t.equals(spyGetSubscriptions.callCount, 1)
      t.equals(spySnsPublish.callCount, 2)
    })
  })

  ot.test("- should return success and not send any trads if theire are no subscribers", (t) => {
    t.plan(5)

    const inn: Inject = {
      getSubscriptions: (streamId: string, timeNow: number) =>
        Promise.resolve(
          Array()
        ),
      snsPublish: (message: any) => <any>Promise.resolve({
        ResponseMetadata: { RequestId: "test-RequestId" },
        MessageId: "test-MessageId"
      }),
      timeNow: () => 12345766876
    }

    const spyGetSubscriptions = sinon.spy(inn, "getSubscriptions")
    const spySnsPublish = sinon.spy(inn, "snsPublish")

    TradeGenerator.action(inn, event, <Context>{ awsRequestId: "test-grid" }).then(x => {
      t.equal(x.GRID, "test-grid", "should return the correct GRID")
      t.equal(x.data, "no active autotrader subscribers", "the trade should not be published")
      t.equal(x.success, true, "the respondse should be a success")
      t.equals(spyGetSubscriptions.callCount, 1)
      t.equals(spySnsPublish.callCount, 0)
    })
  })

  ot.test("- should return failour if its failing when publishing to SNS", (t) => {
    t.plan(5)

    const inn: Inject = {
      getSubscriptions: (streamId: string, timeNow: number) =>
        Promise.resolve(
          Array(
            Promise.resolve({ subscription: 1 }),
            Promise.resolve({ subscription: 2 })
          )
        ),
      snsPublish: (message: any) => <any>Promise.resolve({
        ResponseMetadata: { RequestId: "test-RequestId" }
      }),
      timeNow: () => 12345766876
    }

    const spyGetSubscriptions = sinon.spy(inn, "getSubscriptions")
    const spySnsPublish = sinon.spy(inn, "snsPublish")

    TradeGenerator.action(inn, event, <Context>{ awsRequestId: "test-grid" }).then(x => {
      t.equal(x.GRID, "test-grid", "should return the correct GRID")
      t.equal(x.data, "failed to publish trade for 2 out of 2 subscrbers")
      t.equal(x.success, false, "the respondse should be a NOT success")
      t.equals(spyGetSubscriptions.callCount, 1)
      t.equals(spySnsPublish.callCount, 2)
    })
  })

})