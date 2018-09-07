var rp = require('request-promise');
var request = require('request');
var cheerio = require('cheerio');
var htmlToJson = require('html-to-json');
var tags = require("../models/Tag")

// private constructor:
var Crawler = module.exports = function Crawler(_node) {
    // all we'll really store is the node; the rest of our properties will be
    // derivable or just pass-through properties (see below).
    this._node = _node;
}

Crawler.crawl = function (url, cb) {

    if(url.includes("?")){
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

    } else {
        var options = {
            uri: url,
            headers: {
                'User-Agent': 'Request-Promise'
            },
            json: true // Automatically parses the JSON string in the response
        };
    }
        
    
    console.log(options);
    rp(options)
        .then(function (response) {
            try {
                var n = response.indexOf("/embed/");
                var res2 = response.substring(n - 50, n + 100);
                console.log(res2);
                var sub = res2.search('="http');
                console.log(sub);
                var sub2 = res2.indexOf('"', sub+6);
                console.log(sub2);
                var res3 = res2.substring(sub + 2, sub2);
                console.log(res3);

                var t1 = response.indexOf("<title>");
                var t2 = response.indexOf("</title>");
                var title = response.substring(t1+7, t2);

                var tagArray1 = [];
i=0;
                tags.getAll( function(err , allTags){
                    console.log(allTags);
                    allTags.forEach( function(element) {
                       
                        if(response.indexOf(" "+element.tag.properties.tagName+" ") !== -1){
                            console.log("fondTag: "+element.tag.properties.tagName );
                            // tagArray1.push(element.tag.properties.tagName);
                            tagArray1[i] = element.tag.properties.tagName;
                            i++;
                        }
                    })
                    console.log(tagArray1);
                    cb(res3, title, tagArray1);

                } )
               


            } catch (e) {
                reject(e);
            }
        })
        .catch(function (err) {
            console.log(err);
            // rejected
        });

}

Crawler.addModalDiv = function (url, originalUrl) {
console.log(originalUrl);
    var html2 = '<div class="col-12 flex-wrap" id="cell0x0" >'+
      '<!-- <div class="pl-4" style="border: rgb(19, 161, 243); border-width: 2px; border-style: ridge; padding: 3px; border-radius: 0.9vh; background-color: rgb(175, 213, 238);"> -->'+
      '<div class="row col-12 embed-responsive embed-responsive-16by9">'+
        '<iframe class="embed-responsive-item" src="'+url+'" frameborder="0" allow="autoplay; encrypted-media"'+
          'allowfullscreen id="modalEmbedVideoId">'+
        '</iframe>'+
        '<input type="hidden" id="hiddenURl" value="'+originalUrl+'">'+
        '<button type="button" value="Edit" class="col-2 btn btn-sm btn-primary " style="border-radius: 100vh;" onclick="expandIframe(0,0)">EX</button>'+
      '</div>'+

      '<div class="row col-12 flex-wrap" style="border: rgb(19, 161, 243); border-width: 2px; border-style: ridge; padding: 3px; border-radius: 0.9vh; background-color: rgb(175, 213, 238);">'+
        '<!-- <button class="row col-12 btn btn-sm btn-primary" data-toggle="collapse" data-target="#demo"> -->'+
        '<!-- </button> -->'+
        '<div class="row col-12 flex-wrap">'+

          '<button class="col-2 btn btn-sm btn-primary" type="button" data-toggle="collapse" data-target="#demo" aria-controls="nav-inner-primary"'+
            'aria-expanded="false" aria-label="Toggle navigation" style="margin-left: 20px;">'+
            '<span class="navbar-toggler-icon">V</span>'+
          '</button>'+
          '<input class="col-6 form-control" placeholder="Search" type="text" style="width: 80%;">'+
          '<button type="button" value="Edit" class="col-2 btn btn-sm btn-primary " style="border-radius: 100vh;">S</button>'+
        '</div>'+

        '<div id="demo" class="collapse col-12" style="max-height: 50vh; overflow:auto">'+
          '<div class="container-fluid justify-content-center" style="float: left;" id="progressBarContainer0">'+

          '</div>'+

          '<input type="button" class="btn btn-sm btn-primary" onclick="add_criterion(0)" value="Add" >'+
        '</div>'+
      '</div>'+
    '</div>';


return html2;
}