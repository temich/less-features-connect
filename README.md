less-feature-connect
=======

Usage
-----
    ```javascript
	var connect = require('connect'),
		dispatch = require('dispatch'),
	    less = require('less-features-connect');

	connect()
	    .use(dispatch({'.*\\.css(\\?.*)?': less('styles/lib')}))
	    .listen(process.env.PORT);
    ```