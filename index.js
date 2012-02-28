var less = require('less-features'),
    path = require('path'),
    url = require('url'),
    qs = require('querystring'),
    fs = require('fs');

var root = path.resolve(process.cwd(), '..'),
	config = {};

function filename(uri) {
	return path.resolve(root, url.parse(uri).pathname.substr(1)).replace(/\.css\b/, '.less');
}

function options(filename, uri) {
	var opts = {};

	opts.paths = [];
	opts.paths.push(path.dirname(filename));

	if (config.libs)
        config.libs.forEach(function(lib) {
            opts.paths.push(path.resolve(root, lib));
        });

	var s = url.parse(uri).search,
    	q = s ? qs.parse(s.substring(1)) : undefined;

	if (q && q.features)
		opts.features = q.features.split('|');

	return opts;
}

function handle(req, res) {
	var file = filename(req.url);

	fs.readFile(file, 'utf-8', function (err, data) {
		if (err) throw err;

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
	
	config.libs = libs;
	
	return handle;
};