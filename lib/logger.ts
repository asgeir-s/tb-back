import * as _ from "ramda"

export interface Logger {
  info: (message: string, data: any) => void,
  error: (message: string, data: any) => void,
  exception: (message: string, error: Error) => void,
  log: (infoLevel: string, message: string, data: any) => void,
  raw: (raw: any) => void
}

export const log: Logger = {
  info: _.curry(logMessage)("INFO"),
  error: _.curry(logMessage)("ERROR"),
  exception: exception,
  log: logMessage,
  raw: console.log
}


function logMessage(logLevel: string, message: any, data: any) {
  return console.log(JSON.stringify({
    "level": logLevel,
    "message": message,
    "data": data
  }))
}

function exception(message: string, error: Error) {
  return console.log(JSON.stringify({
    "level": "EXCEPTION",
    "message": message,
    "exceptionName": error.name,
    "exceptionMessage": error.message,
    "stack": error.stack
  }))
}