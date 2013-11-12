var _ = require('lodash')
  , passport = require('passport');

module.exports = function (app, options) {
  return function () {
    if (!options) options = {};

    _.each(options.providers || {}, function (provider, providerName) {
      var path = '/user/auth/' + providerName;

      app.get(path, passport.authenticate(providerName, provider.options));

      app.get(path + '/callback', passport.authenticate(providerName, provider.callback),
        function (req, res) {
          res.redirect(path + '/done');
        }
      );

      app.get(path + '/done', function (req, res) {
        res.redirect('/');
      });
    });

    return function (req, res, next) {
      next();
    };
  };
};