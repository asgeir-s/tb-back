import * as Promise from "bluebird"
import * as crypto from "crypto"
import * as _ from "ramda"


const cryptAlgorithm = "aes-256-ctr"
const digestAlgo = "sha256" // add to pbkdf2 when node is updated on lambda

export interface CryptedData {
  "salt": string
  "iv": string
  // max lengt for one filed is 500 in coinbase. Therefore:
  "data1": string
  "data2"?: string
  "data3"?: string
  "data4"?: string
  "data5"?: string
  "data6"?: string
  "data7"?: string
  "data8"?: string
  "data9"?: string
  "data10"?: string
}

export module Crypto {
  export function encrypt(password: string, jsonContent: any): Promise<CryptedData> {
    return new Promise<CryptedData>((resolve, reject) => {

      const salt = crypto.randomBytes(192)
      const iv = crypto.randomBytes(16)

      crypto.pbkdf2(password, salt, 59999, 16, (err, key) => {
        if (err) {
          console.log("error: " + err)
          reject(err)
        }
        else {
          const cipher = crypto.createCipheriv(cryptAlgorithm, key.toString("hex"), iv)
          let crypted: any = cipher.update(JSON.stringify(jsonContent), "utf8", "hex")
          crypted += cipher.final("hex")

          // max lengt for one filed is 500 in coinbase. Therefore:
          const dataArray = _.splitEvery(499, crypted)
          let object: any = {}
          let count = 0
          dataArray.forEach(x => object["data" + count++] = x)

          object["salt"] = salt.toString("hex")
          object["iv"] = iv.toString("hex")

          resolve(object)
        }
      })
    })
  }

  export function decrypt(password: string, encrypt: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const salt = new Buffer(encrypt.salt, "hex")
      const iv = new Buffer(encrypt.iv, "hex")

      // max lengt for one filed is 500 in coinbase. Therefore:
      let count = 0
      let data = ""
      while (typeof encrypt["data" + count] !== "undefined") {
        data += encrypt["data" + count]
        count++
      }

      crypto.pbkdf2(password, salt, 59999, 16, (err: any, key: any) => {

        if (err) {
          console.log("error: " + err)
          reject(err)
        }
        else {
          const decipher = crypto.createDecipheriv(cryptAlgorithm, key.toString("hex"), iv)
          let decrypted = decipher.update(data, "hex", "utf8")

          decrypted += decipher.final("utf8")

          try { resolve(JSON.parse(decrypted)) }
          catch (e) { reject(e) }
        }
      })
    })
  }

  export function encryptSimple(password: string, content: string): string {
    const cipher = crypto.createCipher(cryptAlgorithm, password)
    let crypted = cipher.update(content, "utf8", "hex")
    crypted += cipher.final("hex")
    return crypted
  }

  export function decryptSimple(password: string, encryptedContent: string): string {
    const decipher = crypto.createDecipher(cryptAlgorithm, password)
    let dec = decipher.update(encryptedContent, "hex", "utf8")
    dec += decipher.final("utf8")
    return dec
  }

}