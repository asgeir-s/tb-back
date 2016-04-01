# Functions
 
  * (SNS) Autotrader
  * () "Compitition winner computer"
  * (SNS) Email Notifyer
  * (HTTP) Coinbase Order Notification
  * (HTTP) Coinbase Get Payment Code
  * (DYNAMO-STREAM) Confirm Subscription Email (to subscriber)
  * (DYNAMO-STREAM) Send "Continue Subscription?" Email to Subscribers With Ending Subscriptions in 5 Days
  * (DYNAMO-STREAM) Send Email to Publishers About New Subscription

# Testing

Currently AWS Lambda runs on Node.js: v0.10.36. Therfore, it must be tested on that version of node:

    nvm use 0.10.36
    tsc && npm-lx tape -- '**/*.tap.js' | npm-lx tap-spec
    
Set npm-lx alias in ~/.zshrc:

    alias npm-lx='PATH=$(npm bin):$PATH'