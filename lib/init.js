var _ = require('lodash');
var express = require('express');
var passport = require('passport');
var app = express();

module.exports = function (options) {
  if (!options) options = {};
  if (!options.path) options.path = '';
  if (!options.providers) options.providers = {};

  function verify(name) {
    return function (req, accessToken, refreshToken, profile, done) {
      var model = req.getModel();
      var query = {};
      query[name + '.id'] = profile.id;
      var $user = model.query('users', query);

      $user.fetch(function (err) {
        if (err) return done(err);
        var user = $user.get()[0];
        if (user) return done(null, {id: user.id});
        $user = model.at('users.' + req.user.id);
        $user.fetch(function (err) {
          $user.set(name, profile);
          user = $user.get();
          if (!user.registered) $user.set('registered', new Date());
          done(null, {id: user.id});
        });
      });
    };
  }

  Object.keys(options.providers).forEach(function (name) {
    var provider = options.providers[name];
    provider.config = provider.config || {};
    provider.config.passReqToCallback = true;
    provider.config.callbackURL = options.origin + options.path + '/auth/' + name + '/callback';

    var strategy = provider.strategy || {};
    strategy.module = strategy.module || 'passport-' + name;
    strategy.name = strategy.name || 'Strategy';

    // the provider's passport strategy can be passed in
    // or it may be referenced/required by name
    var Strategy = _.isFunction(strategy) ?
      strategy :
      require(strategy.module)[strategy.name];

    passport.use(new Strategy(provider.config, verify(name)));
  });

  return app;
};
