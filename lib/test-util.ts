import * as _ from 'ramda'
import assert = require('assert')

export const equals = _.curryN(2, assert.equal)
export const success = (done: any) => (some: any) => done()