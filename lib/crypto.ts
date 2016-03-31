import * as Promise from "bluebird"
import * as crypto from "crypto"

const cryptAlgorithm = "aes-256-ctr"
const digestAlgo = "sha256" // add to pbkdf2 when node is updated on lambda

export interface CryptedData {
  data: any
  salt: string
  iv: string
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
          let crypted = cipher.update(JSON.stringify(jsonContent), "utf8", "hex")
          crypted += cipher.final("hex")
          resolve({
            "data": crypted,
            "salt": salt.toString("hex"),
            "iv": iv.toString("hex")
          })
        }
      })
    })
  }

  export function decrypt(password: string, encrypt: CryptedData): Promise<any> {
    return new Promise((resolve, reject) => {
      const salt = new Buffer(encrypt.salt, "hex")
      const iv = new Buffer(encrypt.iv, "hex")
      const data = encrypt.data

      crypto.pbkdf2(password, salt, 59999, 16, (err: any, key: any) => {

        if (err) {
          console.log("error: " + err)
          reject(err)
        }
        else {
          const decipher = crypto.createDecipheriv(cryptAlgorithm, key.toString("hex"), iv)
          let decrypted = decipher.update(data, "hex", "utf8")

          decrypted += decipher.final("utf8")

          try { resolve(JSON.parse(decrypted))}
          catch (e) { reject(e) }
        }
      })
    })
  }
}
