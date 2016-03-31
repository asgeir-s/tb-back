import * as _ from "ramda"

export interface Logger {
  info: (message: string) => void,
  error: (message: string) => void
}

export function logger(GRID: string): Logger {
  return {
    info: _.curry(info)(GRID),
    error: _.curry(error)(GRID)
  }
}

function info(GRID: string, message: string) {
  return console.log("[INFO] " + message)
}

function error(GRID: string, message: string) {
  return console.error("[ERROR] " + message)
}