'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _sequelize = require('sequelize');

var _helper = require('./helper');

var _helper2 = _interopRequireDefault(_helper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const possibleNumericTypes = [`INTEGER`, `DECIMAL`, `FLOAT`, `DOUBLE`, `INT`, `TINYINT`, `BIGINT`, `NUMBER`, `REAL`];

const possibleStringTypes = [`CHARACTER VARYING`, `VARCHAR`, `TEXT`, `CHAR`, `STRING`, `TINYTEXT`, `MEDIUMTEXT`, `LONGTEXT`];

const isTypeExists = (typesList, item) => {
  return _lodash2.default.filter(typesList, type => item.indexOf(type) > -1).length > 0;
};

const filterColumns = (modelName, config) => {
  return _lodash2.default.filter(config.columns, col => {
    const modelAndColumn = _lodash2.default.takeRight(_helper2.default.getModelAndColumn(col.data), 2);

    return modelName === modelAndColumn[0];
  });
};

const createNameMaps = columns => {
  return _lodash2.default.reduce(columns, (acc, col) => _lodash2.default.merge(acc, {
    [_helper2.default.getModelAndColumn(col.data).pop()]: col
  }), {});
};

const charSearch = (modelName, modelDesc, config, opt, dialect) => {
  const columns = filterColumns(modelName, config);
  const nameMaps = createNameMaps(columns);

  const matchNames = (0, _lodash2.default)(modelDesc).keys().filter(item => {
    const isChar = isTypeExists(possibleStringTypes, modelDesc[item].type);

    return isChar && nameMaps[item] && config.search.value;
  }).value();

  let likeOp = opt.caseInsensitive ? _sequelize.Op.iLike : _sequelize.Op.like;

  if (dialect === 'mysql') {
    likeOp = _sequelize.Op.like;
  }

  return _lodash2.default.map(matchNames, name => ({
    [_helper2.default.searchify(nameMaps[name].data)]: { [likeOp]: `%${config.search.value}%` }
  }));
};

const numericSearch = (modelName, modelDesc, config) => {
  const columns = filterColumns(modelName, config);
  const nameMaps = createNameMaps(columns);

  const matchNames = (0, _lodash2.default)(modelDesc).keys().filter(item => {
    const isNumeric = isTypeExists(possibleNumericTypes, modelDesc[item].type);

    return isNumeric && nameMaps[item] && !_lodash2.default.isNaN(Number(config.search.value));
  }).value();

  return _lodash2.default.map(matchNames, name => ({
    [_helper2.default.searchify(nameMaps[name].data)]: Number(config.search.value)
  }));
};

const booleanSearch = (modelName, modelDesc, config) => {
  const columns = filterColumns(modelName, config);
  const nameMaps = createNameMaps(columns);

  const matchNames = (0, _lodash2.default)(modelDesc).keys().filter(item => {
    const isNumeric = possibleNumericTypes.indexOf(modelDesc[item].type) > -1;

    return isNumeric && nameMaps[item] && _helper2.default.boolAlike(config.search.value);
  }).value();

  return _lodash2.default.map(matchNames, name => ({
    [_helper2.default.searchify(nameMaps[name].data)]: _helper2.default.boolify(config.search.value)
  }));
};

exports.default = {
  numericSearch,
  charSearch,
  booleanSearch
};
module.exports = exports.default;