Derby User Providers
====================

Add 3rd party providers to [derby-user](https://github.com/psirenny/derby-user) such as facebook google, twitter, etc…

Installation
------------

    $ npm install derby-user-providers

In *"/lib/server/index.js"*

    var providers = require('derby-user-gravatar')(expressApp);

    expressApp
      // ...
      .use(user.init())
      .use(providers.init())
      // ...
      .use(user.init())
      .use(providers.routes())