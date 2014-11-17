less-feature-connect
=======

Usage
-----

var connect = require('connect'),
	dispatch = require('dispatch'),
    less = require('less-features-connect'),
	config = require('./config.json');

connect()
    .use(dispatch({ '.*\\.css(\\?.*)?': less(config.less).handle }))
    .listen(process.env.PORT);


config.json file
----------------

{
	"less": {
		"libs": "styles/lib",
		"caching": false,
		"compress": true
	}
}