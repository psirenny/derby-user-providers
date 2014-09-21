var _ = require('lodash');
var express = require('express');
var passport = require('passport');
var app = express();

module.exports = function (options) {
  if (!options) options = {};
  if (!options.providers) options.providers = {};

  Object.keys(options.providers).forEach(function (name) {
    var path = '/auth/' + name;
    var provider = options.providers[name];

    app.get(path, function (req, res, next) {
      var opts = _.merge({}, provider.authOptions, req.query);
      var auth = passport.authenticate(name, opts);
      auth(req, res, next);
    });

    app.get(path + '/callback',
      passport.authenticate(name, provider.callbackOptions),
      function (req, res) {
        res.redirect('./done');
      }
    );

    app.get(path + '/done', function (req, res) {
      res.redirect('/');
    });
  });

  return app;
};
