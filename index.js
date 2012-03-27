var less = require('less'),
    path = require('path'),
    url = require('url'),
    qs = require('querystring'),
    fs = require('fs');

var root = path.resolve(process.cwd(), '..'),
	config = { libs: [] },
	cache = {};

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
		next(err, data);
	});
}

function handle(req, res) {
	res.setHeader('Content-Type', 'text/css');

	if (cache[req.url])
		return res.end(cache[req.url]);

	var file = filename(req.url),
		feats = features(req.url);

	less.tree.functions.feature = function(n) {
		return feats.indexOf(n.value) !== -1 ? less.tree.True : less.tree.False;
	};

	read(file, function (err, data) {
		if (err) {
			if (err.code === 'ENOENT') {
				res.writeHead('404');
				res.end();
				return;
			}

			throw err;
		}

		less.render(data, options(file), function (err, data) {
			if (err) throw err;

			config.caching && (cache[req.url] = data);
			res.end(data);
		});
	});
}

module.exports = function (cfg) {
	config = cfg;
	return handle;
};