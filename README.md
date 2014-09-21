Derby User Providers
====================

Add 3rd party providers to [derby-user](https://github.com/psirenny/derby-user) such as facebook, google, twitter, etc…

Installation
------------

    $ npm install derby-user-providers --save

Server Usage
------------

In your server file, add the middleware:

    var providers = require('derby-user-providers');

    var google = {
      config: {
        clientID: '...',
        clientSecret: '...',
        strategy: {
          module: 'passport-google-oauth',
          name: 'OAuth2Strategy'
        }
      }
    };

    var facebook = {
      config: {
        clientID: '...',
        clientSecret: '...',
        authOptions: {scope: ['email']},
        strategy: require('passport-facebook')
      }
    };

    expressApp
      // ...
      // ...
      // cookieParser, session, transport, model, bodyParser...
      .use(user.init())
      // ...
      // ...
      .use('/user', providers({
        origin: 'http://localhost',
        path: '/user',
        providers: {facebook: facebook, google: google}
      }))

App Usage
---------

In your view:

    <a href="/user/auth/facebook">Sign in with Facebook</a>
    <a href="/user/auth/google">Sign in with Google+</a>

Handling events
---------------

You can handle emitted events.

    var events = require('events');
    var emitter = new events.EvetEmitter();

    emitter.on('user.auth', function (req, data) {
      var model = req.getModel();
      console.log('user ' + data.userId + ' signed in.');
    });

    expressApp
      // ...
      // ...
      .use(providers({
        emitter: emitter, ...
      }))

Routes
------

**/auth/:provider?params** – Call this route to authenticate a user. The params are merged into *authOptions*.

**/auth/:provider/done** – This route is called when authentication is done. Can be overriden. Redirects to */* by default.

Options
-------

**origin** – **Required**. The site origin providers will redirect back to upon sign in.

**emitter** – Specify an event emitter that will handle events.

**path** – Must be set if you use an express path prefix. (See above)

**providers** – An object containing providers and their configuration settings.

Providers
---------

**config** – Configuration options for the strategy. Refer to the passport strategy's docs.

**strategy** – The passport strategy function or an object with the strategy name and/or module.

**authOptions** – Passport authenticate options passed in during verification. Used to pass in scope, etc.

**callbackOptions** – Passport authenticate options passed in during the callback.

Events
------

**user.auth(req, data)** – Event emitted when a new user authenticates. Contains **userId** and **provider** name.
