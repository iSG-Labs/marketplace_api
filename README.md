# Marketplace API

## Installation

```bash
$ yarn install
$ npx husky init
$ node --eval "fs.writeFileSync('.husky/pre-commit','npx lint-staged\n')"
```

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```
