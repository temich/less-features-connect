var less = require('less-context-functions'),
    path = require('path'),
    url = require('url'),
    qs = require('querystring'),
    fs = require('fs'),
    domain = require('domain');

var root = path.resolve(process.cwd(), '..'),
    config = { libs: [] },
    cache = {},
    logger;

function filename(uri) {
    return path.resolve(root, url.parse(uri).pathname.substr(1)).replace(/\.css\b/, '.less');
}

function feature(feats) {
    return function (n) {
        return feats.indexOf(n.value) !== -1 ? less.tree.True : less.tree.False;
    }
}

function features(uri) {
    var s = url.parse(uri).search,
        q = s ? qs.parse(s.substring(1)) : undefined,
        feats = [];

    if (q && q.features)
        feats = q.features.split('|');

    return feats;
}

function options(filename, req) {
    var opts = {};

    opts.paths = [path.dirname(filename), config.libs];
    opts.compress = config.compress;
    opts.functions = { feature: feature(features(req.url)) };

    return opts;
}

function read(file, next) {

    fs.readFile(file, 'utf-8', function (err, data) {
        logger && logger.trace('Reading file ' + file);

        next(err, data);
    });

}

function clearCache() {
    cache = {};
}

function handle(req, res, next) {

    var d = domain.create();

    d.on('error', function(err) {

        err = err || {};
        logger.error('Error processing request', req.url, err);
        console.error('Error processing request', req.url, err);

        try {

            err && err.code !== 'ENOENT'
                ? res.error().end()
                : res.notFound().end();

        } catch (e) {
            logger.error('Error sending 500', err, req.url);
        }

    });

    d.add(req);
    d.add(res);

    if (cache[req.url])
        return res.css(cache[req.url]);

    logger && logger.trace('Processing request' + req.url);

    var file = filename(req.url);

    read(file, d.intercept(function(data) {

        logger && logger.trace('Rendering file ' + file);

        less.render(data, options(file, req), d.intercept(function (data) {
            logger && logger.trace('Sending data (%d bytes) %s', data ? data.length : 0, req.url);

            config.caching && (cache[req.url] = data);
            res.css(data);

            logger && logger.trace('%s has been served successfully', req.url);
        }));

    }));

}

module.exports = function (cfg, log) {
    config = cfg;
    logger = log;
	
	if (config.root) {
		root = path.resolve(root, config.root);
    }

    return {
        handle: handle,
        clearCache: clearCache
    };

};