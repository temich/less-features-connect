var less = require('less-features'),
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

function options(filename, uri) {
	var opts = {};

	opts.paths = [path.dirname(filename)].concat(config.libs);

	var s = url.parse(uri).search,
    	q = s ? qs.parse(s.substring(1)) : undefined;

	if (q && q.features)
		opts.features = q.features.split('|');

	return opts;
}

function read(file, next) {
	if (!cache[file]) {
		fs.readFile(file, 'utf-8', function (err, data) {
			if (err) throw err;

			cache[file] = data;
			next(data);
		});
	} else {
		next(cache[file]);
	}
}

function handle(req, res) {
	var file = filename(req.url);

	read(file, function (data) {

		less.render(data, options(file, req.url), function (err, css) {
			if (err) throw err;

			res.setHeader("Content-Type", "text/css");
			res.end(css);
		});
	});
}

module.exports = function(libs) {
	if (!(libs instanceof Array))
		libs = [libs];
	
	if (libs)
		libs.forEach(function (lib) {
			config.libs.push(path.resolve(root, lib));
		});
	
	return handle;
};