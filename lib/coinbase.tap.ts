import * as test from "tape"
import { Coinbase } from "./coinbase"
import * as _ from "ramda"
import * as sinon from "sinon"


test("Payment:", (ot) => {
  ot.plan(2)

  //const coinbaseCli = Payment.coinbaseClient("", "")

  const clientFac = require("coinbase").Client;
  const sandboxClient = new clientFac({
    "apiKey": "Z0WPTliIqOaW9lb1",
    "apiSecret": "zapgYMztFVblKr3evb2DVHzlkiolBXmT",
    "baseApiUri": "https://api.sandbox.coinbase.com/v2/",
    "tokenUri": "https://api.sandbox.coinbase.com/oauth/token"
  })

  const coinbasePrimaryAccount = "5d7213c3-0ea7-5e2c-b8b2-4d4c58a6f316"
  const coinbaseVault = "2d0fc1a2-761f-5af0-8969-f80338a168e0"

  ot.test("- should be able to create checkout", (t) => {
    t.plan(1)
    Coinbase.createCheckout(sandboxClient, "Test-checkout", "99.99", "description", { "my-date": 1234 })
      .then((res) =>
        t.equal(_.has("embed_code", res), true, "the responds should include the embed_code")
      )
  })

  ot.test("- should be able to transfare money between my accounts", (t) => {
    t.plan(4)

    const transfareMoneyPayout: Coinbase.Payout = {
      to: coinbaseVault,
      amount: "0.000001",
      currency: "BTC",
      description: "test transfare",
      idem: "string"
    }

    Coinbase.transferMoney(sandboxClient, coinbasePrimaryAccount, transfareMoneyPayout)
      .then(res => {
        t.equal(res.type, "transfer", "should have be transfare type")
        t.equal(parseFloat(res.amount.amount), parseFloat("-" + transfareMoneyPayout.amount),
          "should have correct amount")
        t.equal(res.to.id, coinbaseVault, "should be transfared to 'coinbaseVault'")
        t.equal(res.amount.currency, "BTC", "should have amount in BTC")
      })
  })
})
