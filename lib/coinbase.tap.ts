import * as test from "tape"
import { Coinbase } from "./coinbase"
import * as _ from "ramda"
import * as sinon from "sinon"


test("Payment:", (ot) => {''
  ot.plan(1)

  //const coinbaseCli = Payment.coinbaseClient("", "")

  const clientFac = require("coinbase").Client;
  const sandboxClient = new clientFac({
    "apiKey": "Z0WPTliIqOaW9lb1",
    "apiSecret": "zapgYMztFVblKr3evb2DVHzlkiolBXmT",
    "baseApiUri": "https://api.sandbox.coinbase.com/v2/",
    "tokenUri": "https://api.sandbox.coinbase.com/oauth/token"
  })

  ot.test("- should be able to create checkout", (t) => {
    t.plan(1)
    Coinbase.createCheckout(sandboxClient, "Test-checkout", "99.99", "description", { "my-date": 1234 })
      .then((res) =>
        t.equal(_.has("embed_code", res), true, "the responds should include the embed_code")
      )
  })
})
