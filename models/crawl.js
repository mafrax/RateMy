var rp = require('request-promise');

// private constructor:
var Crawler = module.exports = function Crawler(_node) {
	// all we'll really store is the node; the rest of our properties will be
	// derivable or just pass-through properties (see below).
	this._node = _node;
}

Crawler.crawl = function crawl(){
    rp('https://fr.pornhub.com/')
        .then(function (response) {
            try {
                var n = response.indexOf("embed");
                var m = response.indexOf("<iframe");
                var o = response.indexOf("iframe>");
                var res = response.substring(m, o);
                console.log(n);
                console.log(m);
                console.log(o);
                console.log(res);
                console.log(response);
            } catch(e) {
                reject(e);
            }
        })
        .catch(function (err) {
            console.log(err);
            // rejected
        });
}