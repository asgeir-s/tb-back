import * as test from "tape"
import { DynamoDb, SES, SNS } from "./aws"
import * as _ from "ramda"
import { Signals } from "./signals"
import * as sinon from "sinon"

const SIGNALS_URL = "http://tb-staging-signals.elasticbeanstalk.com"
const SIGNALS_APIKEY = "secret"

const testStream = "e0c6fc18-9e08-43f9-9f68-10bd87d552d7"


test("Signals-GET:", (ot) => {
  ot.plan(3)

  const timestamp = new Date().getTime()

  ot.test("- should be able to get all closed signals", (t) => {
    t.plan(2)

    Signals.getClosedSignals(SIGNALS_URL, SIGNALS_APIKEY, "test-grid", testStream)
      .then(signals => {
        t.equal(signals.length > 0, true, "some signals should be returned")
        t.equal(signals[0].signal, 0, "last signal should be CLOSE") // newest signal is first
      })
  })

  ot.test("- should NOT be able to get signals with wrong secret", (t) => {
    t.plan(1)

    Signals.getClosedSignals(SIGNALS_URL, "wrong", "test-grid", testStream)
      .catch((e: Error) => {
        t.equals(e.message.indexOf("not authorized") > -1, true, "shpuld fail, with authentification error")
      })

  })

  ot.test("- should return empety array when not found", (t) => {
    t.plan(1)

    Signals.getClosedSignals(SIGNALS_URL, SIGNALS_APIKEY, "test-grid", "e0c6fc18-9e08-9-9f68-10bd87d552d7")
      .then(signals => {
        t.equal(signals.length, 0, "empety ")
      })

  })
})


test("Signals-POST:", (ot) => {
  ot.plan(4)

  ot.test("closes any open position (if any)", (t) => {
    t.plan(1)

    Signals.postSignal(SIGNALS_URL, SIGNALS_APIKEY, "test-grid", testStream, 0)
      .then(() => t.equal(1, 1))
      .catch((e: Error) => t.equal(e.message.indexOf("duplicate") > -1, true))
  })

  ot.test("- a valide signals should return the signal info", (t) => {
    t.plan(10)

    Signals.postSignal(SIGNALS_URL, SIGNALS_APIKEY, "test-grid", testStream, 1)
      .then(signals => {
        t.equal(signals.length, 1, "should return one signal")
        t.equal(signals[0].signal, 1, "the signal should be 'LONG'")
        t.equal(_.has("timestamp", signals[0]), true, "should have the attribute")
        t.equal(_.has("price", signals[0]), true, "should have the attribute")
        t.equal(_.has("change", signals[0]), true, "should have the attribute")
        t.equal(_.has("id", signals[0]), true, "should have the attribute")
        t.equal(_.has("signal", signals[0]), true, "should have the attribute")
        t.equal(_.has("changeInclFee", signals[0]), true, "should have the attribute")
        t.equal(_.has("value", signals[0]), true, "should have the attribute")
        t.equal(_.has("valueInclFee", signals[0]), true, "should have the attribute")
      })
  })

  ot.test("- should return 'duplicate', when the signal is the same as the last signal", (t) => {
    t.plan(1)

    Signals.postSignal(SIGNALS_URL, SIGNALS_APIKEY, "test-grid", testStream, 1)
      .catch((e: Error) => t.equal(e.message.indexOf("duplicate") > -1, true))
  })

  ot.test("- a valide 'revers- porition' signals should return the signal info for two signals", (t) => {
    t.plan(19)

    Signals.postSignal(SIGNALS_URL, SIGNALS_APIKEY, "test-grid", testStream, -1)
      .then(signals => {
        t.equal(signals.length, 2, "should return two signal")
        t.equal(signals[0].signal, -1, "the signal should be 'SHORT'")
        t.equal(_.has("timestamp", signals[0]), true, "should have the attribute")
        t.equal(_.has("price", signals[0]), true, "should have the attribute")
        t.equal(_.has("change", signals[0]), true, "should have the attribute")
        t.equal(_.has("id", signals[0]), true, "should have the attribute")
        t.equal(_.has("signal", signals[0]), true, "should have the attribute")
        t.equal(_.has("changeInclFee", signals[0]), true, "should have the attribute")
        t.equal(_.has("value", signals[0]), true, "should have the attribute")
        t.equal(_.has("valueInclFee", signals[0]), true, "should have the attribute")

        t.equal(signals[1].signal, 0, "the signal should be 'CLOSE'")
        t.equal(_.has("timestamp", signals[1]), true, "should have the attribute")
        t.equal(_.has("price", signals[1]), true, "should have the attribute")
        t.equal(_.has("change", signals[1]), true, "should have the attribute")
        t.equal(_.has("id", signals[1]), true, "should have the attribute")
        t.equal(_.has("signal", signals[1]), true, "should have the attribute")
        t.equal(_.has("changeInclFee", signals[1]), true, "should have the attribute")
        t.equal(_.has("value", signals[1]), true, "should have the attribute")
        t.equal(_.has("valueInclFee", signals[1]), true, "should have the attribute")
      })
  })
})