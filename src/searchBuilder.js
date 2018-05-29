import _ from 'lodash'
import { Op } from 'sequelize'
import helper from './helper'

const possibleNumericTypes = [
  `INTEGER`,
  `DECIMAL`,
  `FLOAT`,
  `DOUBLE`,
  `INT`,
  `TINYINT`,
  `BIGINT`,
  `NUMBER`,
  `REAL`
]

const possibleStringTypes = [
  `CHARACTER VARYING`,
  `VARCHAR`,
  `TEXT`,
  `CHAR`,
  `STRING`,
  `TINYTEXT`,
  `MEDIUMTEXT`,
  `LONGTEXT`
]

const isTypeExists = (typesList, item) => {
  return _.filter(typesList, type => item.indexOf(type) > -1).length > 0
}

const filterColumns = (modelName, config) => {
  return _.filter(config.columns, (col) => {
    const modelAndColumn = _.takeRight(helper.getModelAndColumn(col.data), 2)

    return modelName === modelAndColumn[0]
  })
}

const createNameMaps = (columns) => {
  return _.reduce(columns, (acc, col) => _.merge(acc, {
    [helper.getModelAndColumn(col.data).pop()]: col
  }), {})
}

const charSearch = (modelName, modelDesc, config, opt, dialect) => {
  const columns = filterColumns(modelName, config)
  const nameMaps = createNameMaps(columns)

  const matchNames = _(modelDesc)
    .keys()
    .filter((item) => {
      const isChar = isTypeExists(possibleStringTypes, modelDesc[item].type)

      return isChar && nameMaps[item] && config.search.value
    })
    .value()

  let likeOp = opt.caseInsensitive ? Op.iLike : Op.like

  if (dialect === 'mysql') {
    likeOp = Op.like
  }

  return _.map(matchNames, name => ({
    [helper.searchify(nameMaps[name].data)]: { [likeOp]: `%${config.search.value}%` }
  }))
}

const numericSearch = (modelName, modelDesc, config) => {
  const columns = filterColumns(modelName, config)
  const nameMaps = createNameMaps(columns)

  const matchNames = _(modelDesc)
    .keys()
    .filter((item) => {
      const isNumeric = isTypeExists(possibleNumericTypes, modelDesc[item].type)

      return isNumeric && nameMaps[item] && !_.isNaN(Number(config.search.value))
    })
    .value()

  return _.map(matchNames, name => ({
    [helper.searchify(nameMaps[name].data)]: Number(config.search.value)
  }))
}

const booleanSearch = (modelName, modelDesc, config) => {
  const columns = filterColumns(modelName, config)
  const nameMaps = createNameMaps(columns)

  const matchNames = _(modelDesc)
    .keys()
    .filter((item) => {
      const isNumeric = possibleNumericTypes.indexOf(modelDesc[item].type) > -1

      return isNumeric && nameMaps[item] && helper.boolAlike(config.search.value)
    })
    .value()

  return _.map(matchNames, name => ({
    [helper.searchify(nameMaps[name].data)]: helper.boolify(config.search.value)
  }))
}

export default {
  numericSearch,
  charSearch,
  booleanSearch
}
