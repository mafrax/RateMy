var rp = require('request-promise');
var request = require('request');
var cheerio = require('cheerio');

// private constructor:
var Crawler = module.exports = function Crawler(_node) {
    // all we'll really store is the node; the rest of our properties will be
    // derivable or just pass-through properties (see below).
    this._node = _node;
}

Crawler.crawl = function (url, cb) {


    var parts = url.split("?");
    console.log(parts[0]);
    var qsArray = parts[1].split("=");
    var vK = qsArray[0];
    var vkValue = qsArray[1];
    var truc = vK.valueOf();


    console.log(truc);

    var options = {
        uri: parts[0],
        qs: {
            // promo : vkValue // -> uri + '?access_token=xxxxx%20xxxxx'
        },
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true // Automatically parses the JSON string in the response
    };

    console.log(options.qs);
    options.qs[vK.valueOf()] = vkValue;
    console.log(options.qs);
    console.log(options);
    rp(options)
        .then(function (response) {
            try {
                var n = response.indexOf("/embed/");
                var res2 = response.substring(n - 50, n + 50);
                console.log(res2);
                var sub = res2.search('="http');
                console.log(sub);
                var sub2 = res2.indexOf('"', sub + 4);
                console.log(sub2);
                var res3 = res2.substring(sub + 2, sub2);
                console.log(res3);

                cb(res3);

            } catch (e) {
                reject(e);
            }
        })
        .catch(function (err) {
            console.log(err);
            // rejected
        });

}

Crawler.crawl2 = function () {
    var url = "https://fr.pornhub.com/view_video.php?viewkey=ph5b5bbe547bfe2";

    request(url, function (error, response, body) {
        if (!error) {
            var $ = cheerio.load(body);

            var title = $('title').text();
            var content = $('body').text();
            var freeArticles = $('.central-featured-lang.lang1 a small').text()

            console.log('URL: ' + url);
            console.log('Title: ' + title);
            console.log('EN articles: ' + freeArticles);
        }
        else {
            console.log("We’ve encountered an error: " + error);
        }
    });

}

Crawler.addModalDiv = function () {

    var html2 = '<div class="modal fade" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">' +
        '<div class="modal-dialog" role="document">' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        '<h5 class="modal-title" id="exampleModalLabel">Modal title</h5>' +
        '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
        '</button>' +
        '</div>' +
        '<div class="modal-body">' +
        '...' +
        '</div>' +
        '<div class="modal-footer">' +
        '<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>' +
        '<button type="button" class="btn btn-primary">Save changes</button>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>';

return html2;

    // var new_element = document.createElement("div");
    //     new_element.setAttribute('class', "modal fade");
    //     new_element.setAttribute('id', 'exampleModal');
    //     new_element.setAttribute('tabindex', '-1');
    //     new_element.setAttribute('role', 'dialog');
    //     new_element.setAttribute('aria-labelledby', 'exampleModalLabel');
    //     new_element.setAttribute('aria-hidden', 'hidden');

    //     new_element.innerHTML = html2;
    //     console.log(new_element);
    //     max_div.appendChild(new_element);

}