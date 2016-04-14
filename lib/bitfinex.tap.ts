import * as test from "tape"
import { Bitfinex } from "./bitfinex"
import * as _ from "ramda"
import * as sinon from "sinon"


test("Bitfinex:", (ot) => {
  ot.plan(1)

  const apiKey = "HXPk6RertR406iPJQVr6cVGonNR7KkV2kkyRIslHOXE"
  const apiSecret = "MCWJITafHaoM2Rs6lpoYVTMeuhpNZ2NOqyWV5yoDqzF"

  ot.test("- should have a tradable balance", (t) => {
    t.plan(1)

    Bitfinex.getTradableBalance(apiKey, apiSecret)
      .then(balance => {
        t.equal(isNaN(balance), false, "should return a number")
      })
  })

})
