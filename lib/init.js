var _ = require('lodash')
  , passport = require('passport');

module.exports = function (app, options) {
  return function () {
    if (!options) options = {};

    _.each(options.providers || {}, function (provider, providerName) {
      provider.config.callbackURL = options.origin + '/user/auth/' + providerName + '/callback';
      provider.config.passReqToCallback = true;

      if (!provider.strategy) provider.strategy = {};
      var strategy = provider.strategy;
      strategy.module = strategy.module || 'passport-' + providerName;
      strategy.name = strategy.name || 'Strategy';
      var Strategy = _.isFunction(strategy) ? strategy : require(strategy.module)[strategy.name];

      passport.use(new Strategy(provider.config,
        function (req, accessToken, refreshToken, profile, done) {
          var model = req.getModel()
            , userId = model.get('_session.user.id')
            , queryId = {}
            , queryTarget = {$or: [queryId]}
            , $query = model.query('usersPrivate', queryTarget);

          if (profile.emails) queryTarget.$or.push({'local.emails': {$in: profile.emails}});
          queryId[providerName + '.id'] = profile.id;
          $query.fetch(function (err) {
            if (err) return done(err);
            var user = $query.get()[0];
            if (user) {
              model.set('_session.user.id', user.id);
              req.session.user.id = user.id;
              userId = user.id;
            }
            var $public = model.at('usersPublic.' + userId);
            var $private = model.at('usersPrivate.' + userId);
            model.fetch($public, $private, function (err) {
              if (err) return done(err);
              var wasRegistered = $public.set('isRegistered', true);
              if (!wasRegistered) $public.set('joined', new Date());
              $private.setNull('local.emails', profile.emails || null);
              var $provider = $public.at(providerName);
              $provider.set('id', profile.id);
              if (profile._json.picture) $provider.set('photos.0.value', profile._json.picture);
              if (profile.displayName) $provider.set('displayName', profile.displayName);
              if (profile.photos) $provider.set('photos', profile.photos);
              if (profile.username) $provider.set('username', profile.username);
              $provider = $private.at(providerName);
              $provider.set(_.omit(profile, 'displayName', 'username'));
              return done(null, profile);
            });
          });
        }
      ));
    });

    return function (req, res, next) {
      next();
    };
  };
};