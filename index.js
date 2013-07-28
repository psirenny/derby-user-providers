var _ = require('lodash')
  , dotty = require('dotty')
  , fs = require('fs')
  , JSONSelect = require('JSONSelect')
  , passport = require('passport')
  , traverse = require('traverse');

module.exports = function (app, options) {
  options = _.merge(options || {}, {
    mapping: {
      private: ':root',
      public: {
        _json: {
          picture: '._json .picture'
        },
        displayName: '.displayName',
        photos: '.photos',
        username: '.username'
      }
    },
    strategies: {}
  });

  _.each(options.strategies, function (strategy, name) {
    _.merge(strategy, {
      callback: {
        popup: true,
        url: '/auth/' + name + '/callback'
      },
      config: {},
      module: 'passport-' + name,
      name: 'Strategy',
      options: {
        url: '/auth/' + name
      },
      verify: function (callback) {
        return function () {
          var req = arguments[0]
            , profile = _.last(arguments, 2)[0]
            , profileId = arguments.length === 4 ? arguments[1] : profile.id
            , done = _.last(arguments);

          callback(req, profileId, profile, done);
        };
      }
    }, _.defaults);

    strategy.config.passReqToCallback = true;
  });

  return {
    init: function () {
      app.use(passport.initialize());
      app.use(passport.session());

      passport.serializeUser(function (user, done) {
        done(null, user.id);
      });

      passport.deserializeUser(function (userId, done) {
        return done(null, {id: userId});
      });

      _.each(options.strategies, function (strategy, name) {
        var Strategy = require(strategy.module)[strategy.name];

        passport.use(new Strategy(strategy.config, strategy.verify(
          function (req, profileId, profile, done) {
            var model = req.getModel()
              , target = {$query: {}}
              , userId = model.get('_session.user.id')
              , user = {id: userId, registered: true, updateDate: new Date()}
              , $user = model.at('usersPublic.' + userId);

            target.$query['providers.' + name + '.id'] = profileId;
            var query = model.query('usersPublic', target)

            model.fetch(query, function (err) {
              if (err) return done(err);
              var foundUserId = dotty.get(query.get(), '0.id');
              user.id = foundUserId || user.id;

              $user.fetch(function (err) {
                if (err) return done(err);
                if (!foundUserId && !$user.get('registered')) {
                  user.defaultProvider = name;
                  user.joinDate = user.updateDate;
                }
              });

              // map profile across user collections
              var mapped = traverse(options.mapping).map(function (selector) {
                if (this.isLeaf) {
                  this.update(JSONSelect.match(selector, profile)[0], true);
                }
              });

              _.each(['Private', 'Public'], function (lvl) {
                var $user = model.at('users' + lvl + '.' + user.id)
                  , $provider = $user.at('providers.' + name);

                lvl = lvl.toLowerCase();

                $user.fetch(function (err) {
                  if (err) return done(err);
                  $user.set(_.merge($user.get(), user));
                  if (mapped[lvl]) $provider.set(mapped[lvl]);
                  $provider.set('id', profileId);
                });
              });

              req.userUtil.save(req, user);
              done(null, _.pick(user, 'id'));
            });
          }
        )));
      });

      return function (req, res, next) {
        next();
      }
    },
    routes: function () {
      _.each(options.strategies, function (strategy, name) {
        app.get(strategy.options.url, passport.authenticate(name, strategy.options));

        app.get(strategy.callback.url, passport.authenticate(name, strategy.callback), function (req, res) {
          if (!strategy.callback.popup) return res.redirect('/');

          fs.readFile(__dirname + '/callback.html', 'utf8', function (err, file) {
            if (err) return res.send(500, {error: err});
            var model = req.getModel()
              , tmpl = _.template(file)
              , html = tmpl({userId: model.get('_session.user.id')});

            res.send(html);
          });
        });
      });
    }
  };
};