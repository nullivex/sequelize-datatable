'use strict'

const dialect = process.env.DIALECT || `postgres`
const enableLogging = process.env.LOGGING === `1`

const ports = {
  mysql: 3307,
  postgres: 5432
}
const databaseNames = {
  postgres: `postgres`,
  mysql: `sequelizedt`
}

const credentials = {
  mysql: [`root`, ``],
  postgres: [`postgres`, null]
}

module.exports = {
  db_config: {
    dialect,
    host: `localhost`,
    port: ports[dialect],
    operatorsAliases: false,
    logging: enableLogging
  },
  credentials: credentials[dialect],
  db_name: databaseNames[dialect]
}
