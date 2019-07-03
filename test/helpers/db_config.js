'use strict'

const dialect = process.env.DIALECT || `postgres`
const enableLogging = process.env.LOGGING === `1`

const ports = {
  mysql: 3307,
  postgres: 5432
}
const databaseNames = {
  postgres: `sequelizedt`,
  mysql: `sequelizedt`
}

const credentials = {
  mysql: [`sequelizedt`, `sequelizedt`],
  postgres: [`sequelizedt`, 'sequelizedt']
}

module.exports = {
  db_config: {
    dialect,
    host: `localhost`,
    port: ports[dialect],
    logging: enableLogging
  },
  credentials: credentials[dialect],
  db_name: databaseNames[dialect]
}
