import * as test from "tape"
import { Crypto } from "./crypto"
import * as _ from "ramda"
import * as sinon from "sinon"


test("Crypto:", (ot) => {
  ot.plan(4)

  ot.test("- should be able to encrypt and decrypt data", (t) => {
    t.plan(1)

    const password = "passwordpasswordpasswordpasswordpasswordpasswordpasswordpasswordpasswordpasswordpasswordpassword"

    const rawData = {
      "email": "sogasg@gmail.com",
      "streamId": "43a2cfb3-6026-4a85-b3ab-2468f7d963aa",
      "autoTrader": false
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

  ot.test("- should be able to encrypt and decrypt data with simple (password) encryption", (t) => {
    t.plan(1)

    const password = "passwordpasswordpasswordpasswordpasswordpasswordpasswordpasswordpasswordpasswordpasswordpassword"
    const rawData = "the raw content"

    const encrypted = Crypto.encryptSimple(password, rawData)
    const decrypted = Crypto.decryptSimple(password, encrypted)

    t.equal(decrypted, rawData, "the encrypted and decrypted data should be equal to the original data")
  })


  ot.test("- should be able to encrypt and decrypt LOTS (must be concatinated) of data", (t) => {
    t.plan(1)

    const password = "passwordpasswordpasswordpasswordpasswordpasswordpasswordpasswordpasswordpasswordpasswordpassword"

    const rawData = {
      "_id": "56fe204c98aaab8fe5763da5",
      "index": 6,
      "guid": "16aaa7af-58d4-4def-82bc-033c14c7a61e",
      "isActive": true,
      "balance": "$3,544.80",
      "picture": "http://placehold.it/32x32",
      "age": 23,
      "eyeColor": "blue",
      "name": "Richardson Caldwell",
      "gender": "male",
      "company": "ANIXANG",
      "email": "richardsoncaldwell@anixang.com",
      "phone": "+1 (967) 550-3165",
      "address": "815 Brooklyn Road, Wilsonia, Pennsylvania, 6079",
      "about": "Nisi enim tempor ea laboris consectetur quis duis veniam velit dolor nulla adipisicing ad aliqua. Minim enim esse ea eiusmod laborum ea non eu veniam irure. Velit qui duis non ea magna officia minim eiusmod culpa dolor dolor. Sint Lorem aliquip magna enim fugiat. Minim reprehenderit sit Lorem amet nisi.\r\n",
      "registered": "2015-01-02T09:53:42 -01:00",
      "latitude": -21.228292,
      "longitude": -98.844814,
      "tags": [
        "officia",
        "non",
        "quis",
        "veniam",
        "ullamco",
        "cupidatat",
        "tempor"
      ],
      "friends": [
        {
          "id": 0,
          "name": "Mcneil Townsend"
        },
        {
          "id": 1,
          "name": "Lindsey Matthews"
        },
        {
          "id": 2,
          "name": "Pugh Guthrie"
        }
      ],
      "greeting": "Hello, Richardson Caldwell! You have 8 unread messages.",
      "favoriteFruit": "strawberry"
    }

    Crypto.encrypt(password, rawData)
      .then(encrypted => Crypto.decrypt(password, encrypted))
      .then(decrypted => t.deepEqual(rawData, decrypted,
        "the encrypted and decrypted data should be equal to the original data"))

  })
})
