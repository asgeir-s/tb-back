import * as _ from 'ramda'

export interface Logger {
  info: (message: string) => void,
  error: (message: string) => void,
  event: (message: string) => void
}

export function logger(GRID: string): Logger {
  return {
    info: _.curry(info)(GRID),
    error: _.curry(error)(GRID),
    event: _.curry(event)(GRID)
  }
}

function info(GRID: string, message: string) {
  return console.log('info [' + GRID + '] ' + message)
}

function error(GRID: string, message: string) {
  return console.error('error [' + GRID + '] ' + message)
}

function event(GRID: string, event: any) {
  return console.log('info [' + GRID + '] Event: ' + JSON.stringify(event))
}