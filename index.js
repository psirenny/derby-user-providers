module.exports = function (app, options) {
  if (!options) options = {};
  if (!options.origin) options.origin = 'http://localhost:3000'

  return {
    init: require('./lib/init')(app, options),
    routes: require('./lib/routes')(app, options)
  }
};