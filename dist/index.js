'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _sequelize = require('sequelize');

var _searchBuilder = require('./searchBuilder');

var _searchBuilder2 = _interopRequireDefault(_searchBuilder);

var _helper = require('./helper');

var _helper2 = _interopRequireDefault(_helper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const describe = model => model.describe();

const paginate = config => {
  if (_lodash2.default.isUndefined(config.start) || _lodash2.default.isUndefined(config.length)) {
    return {};
  }

  const start = Number(config.start);
  const length = Number(config.length);

  if (_lodash2.default.isNaN(start) || _lodash2.default.isNaN(length)) {
    return {};
  }

  return {
    offset: start,
    limit: length
  };
};

const search = async (model, config, modelName, opt) => {
  if (_lodash2.default.isUndefined(config.search) || !config.search.value) {
    return _bluebird2.default.resolve({});
  }

  const dialect = _helper2.default.getDialectFromModel(model);
  const description = await describe(model);

  return _lodash2.default.concat(_searchBuilder2.default.charSearch(modelName, description, config, opt, dialect), _searchBuilder2.default.numericSearch(modelName, description, config, opt), _searchBuilder2.default.booleanSearch(modelName, description, config, opt));
};

const buildSearch = async (model, config, params, opt) => {
  const leaves = _helper2.default.dfs(params, [], []);

  if (_lodash2.default.isUndefined(config.search) || !config.search.value) {
    return _bluebird2.default.resolve({});
  }

  const result = await _bluebird2.default.map(leaves, leaf => search(leaf.model || model, config, leaf.as || ``, opt));

  const objects = _lodash2.default.filter(result, res => _lodash2.default.isObject(res) && !_lodash2.default.isArray(res) && !_lodash2.default.isEmpty(res));
  const arrays = _lodash2.default.filter(result, res => _lodash2.default.isArray(res) && !_lodash2.default.isEmpty(res));

  const reducedArrays = _lodash2.default.reduce(arrays, (acc, val) => _lodash2.default.concat(acc, val), []);
  const reducedObject = _lodash2.default.reduce(objects, (acc, val) => _lodash2.default.merge(acc, val), {});

  const concatenated = {
    [_sequelize.Op.or]: _lodash2.default.filter(_lodash2.default.concat(reducedArrays, reducedObject), res => !_lodash2.default.isEmpty(res))
  };

  return concatenated;
};

const buildOrder = (model, config, params) => {
  if (!config.order) {
    return [];
  }

  const order = config.order[0];
  const col = config.columns[order.column].data;
  const leaves = _helper2.default.dfs(params, [], []);

  if (col.indexOf(`.`) > -1) {
    const splitted = col.split(`.`);
    const colName = splitted.pop();

    const orders = _lodash2.default.compact(_lodash2.default.map(splitted, modelName => {
      const found = _lodash2.default.filter(leaves, leaf => leaf.as === modelName)[0];

      if (!found) {
        return false;
      }

      return {
        model: found.model,
        as: found.as
      };
    }));

    if (orders.length < 1) {
      return [];
    }

    orders.push(colName);
    orders.push(order.dir.toUpperCase());

    return orders;
  }

  return [_helper2.default.getColumnName(col), order.dir.toUpperCase()];
};

const getResult = async (model, config, modelParams, opt) => {
  const params = modelParams;

  const searchResult = await buildSearch(model, config, params, opt);

  if (params.where) {
    params.where = {
      [_sequelize.Op.and]: [params.where, searchResult]
    };
  } else {
    params.where = searchResult;
  }

  const orderResult = await buildOrder(model, config, params);
  if (orderResult.length > 0) {
    params.order = [orderResult];
  }

  _lodash2.default.assign(params, paginate(config));

  const result = await _bluebird2.default.all([model.count({}), model.findAndCountAll(params)]);

  return {
    draw: Number(config.draw),
    data: _lodash2.default.map(result[1].rows, row => row.toJSON()),
    recordsFiltered: result[1].count,
    recordsTotal: result[0],
    _: config._
  };
};

const dataTable = async (model, config, modelParams, options) => {
  const opt = options || {};
  if (!model || !config) {
    return _bluebird2.default.reject(new Error(`Model and config should be provided`));
  }

  const finalResult = await getResult(model, config, modelParams || {}, opt);
  return finalResult;
};

exports.default = dataTable;
module.exports = exports.default;