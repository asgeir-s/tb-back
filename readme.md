node 19.0.x run tests: tsc && npm-lx tape -- '**/*.tap.js' | npm-lx tap-spec

# Testing

Currently AWS Lambda runs on Node.js: v0.10.36. Therfore, it must be tested on that version of node:

    nvm use 0.10.36
    tsc && npm-lx tape -- '**/*.tap.js' | npm-lx tap-spec
    
Set npm-lx alias in ~/.zshrc:

    alias npm-lx='PATH=$(npm bin):$PATH'