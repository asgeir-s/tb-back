import * as test from "tape"
import { Crypto } from "./crypto"
import * as _ from "ramda"
import * as sinon from "sinon"


test("Crypto:", (ot) => {
  ot.plan(2)

  ot.test("- should be able to encrypt and decrypt data", (t) => {
    t.plan(1)

    const password = "passwordpasswordpasswordpasswordpasswordpasswordpasswordpasswordpasswordpasswordpasswordpassword"

    const rawData = {
      "field1": "data",
      "number": 22,
      "map": {
        "inner": "223"
      }
    }

    Crypto.encrypt(password, rawData)
      .then(encrypted => Crypto.decrypt(password, encrypted))
      .then(decrypted => t.deepEqual(rawData, decrypted,
        "the encrypted and decrypted data should be equal to the original data"))

  })

  ot.test("- should NOT be able to encrypt and decrypt data with NOT matching passwords", (t) => {
    t.plan(1)

    const password1 = "passwordpasswordpasswordpasswordpasswordpasswordpasswordpasswordpasswordpasswordpasswordpassword"
    const password2 = "passwordpasswordpasswordpasswordpasswordpasswordpassordpasswordpasswordpasswordpasswordpasswords"

    const rawData = {
      "field1": "data",
      "number": 22
    }

    Crypto.encrypt(password2, rawData)
      .then(encrypted => Crypto.decrypt(password1, encrypted))
      .then(decrypted => t.fail("the encrypted and decrypted data should be equal to the original data"))
      .catch(err => t.pass("should decrypting with false password should fail"))
  })
})
