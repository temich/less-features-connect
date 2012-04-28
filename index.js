var less = require('less'),
    path = require('path'),
    url = require('url'),
    qs = require('querystring'),
    fs = require('fs');

var root = path.resolve(process.cwd(), '..'),
	config = { libs: [] },
	cache = {},
	logger;

function filename(uri) {
	return path.resolve(root, url.parse(uri).pathname.substr(1)).replace(/\.css\b/, '.less');
}

function features(uri) {
	var s = url.parse(uri).search,
    	q = s ? qs.parse(s.substring(1)) : undefined,
		feats = [];

	if (q && q.features)
		feats = q.features.split('|');

	return feats;
}

function options(filename) {
	var opts = {};

	opts.paths = [path.dirname(filename), config.libs];
	opts.compress = config.compress;

	return opts;
}

function read(file, next) {
	fs.readFile(file, 'utf-8', function (err, data) {
		logger && logger.trace('Reading file ' + file);
		
		next(err, data);
	});
}

function handle(req, res, next) {
	logger && logger.trace('Processing request ' + req.url);

	if (cache[req.url]){
		logger.trace('%s has bben found in cache. Serving from cache', req.url);
		return res.css(cache[req.url]);
	}

	var file = filename(req.url),
		feats = features(req.url);

	less.tree.functions.feature = function (n) {
		return feats.indexOf(n.value) !== -1 ? less.tree.True : less.tree.False;
	};

	read(file, function (err, data) {
		if (err) {
			if (err.code !== 'ENOENT') {
				res.error('500');
				throw err;
			} else
				return res.notFound();
		}

		logger && logger.trace('Rendering file ' + file);

		less.render(data, options(file), function (err, data) {
			if (err) {
				res.error();
				throw err;
			}

			logger && logger.trace('Sending data (%d bytes) %s', data ? data.length : 0, req.url);

			config.caching && (cache[req.url] = data);
			res.css(data);
			logger.trace('%s has been served successfully', req.url);
			//next();
		});
	});
}

module.exports = function (cfg, log) {
	config = cfg;
	logger = log;
	
	return handle;
};