var rp = require('request-promise');
var cheerio = require('cheerio');
var tagsBase = require("../models/Tag");


// private constructor:
var Crawler = module.exports = function Crawler(_node) {
    // all we'll really store is the node; the rest of our properties will be
    // derivable or just pass-through properties (see below).
    this._node = _node;
};

Crawler.crawl = function (url, cb) {

    if (url.includes("?")) {
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
            json: true, // Automatically parses the JSON string in the response
            transform: function (body) {
                return cheerio.load(body);
            }
        };

        console.log(options.qs);
        options.qs[vK.valueOf()] = vkValue;

    } else {
        var options = {
            uri: url,
            headers: {
                'User-Agent': 'Request-Promise'
            },
            json: true, // Automatically parses the JSON string in the response
            transform: function (body) {
                return cheerio.load(body);
            }
        };
    }


    rp(options)
        .then(function ($) {
            try {

                var p = $("meta[content*='embed'][content*='https']");
                var q = $("textarea:contains('iframe'):contains('embed')");
                var newHtml = []

                if (p.length > 0) {
                    $("meta[content*='embed'][content*='https']").each(function () {
                        newHtml.push($(this).attr().content);
                    })
                } else if (q) {
                    $("textarea:contains('iframe'):contains('embed')").each(function () {
                        var sub = $(this).text().substring($(this).text().indexOf("src=") + 5, ($(this).text().length - 1));
                        var subsub = sub.substring(0, sub.indexOf('"'));
                        newHtml.push(subsub);
                    })
                }

                // var r = $("textarea:contains('iframe')")[0].childNodes[0].data;
                var tqgs = $("a[href*='keyword']");
                var tpgs = $("a[href*='categor']");
                var tOgs = $("a[href*='tags']");
                var tIgs = $("a[href*='search?search']");

                var tags = [];

                if (tpgs) {
                    $("a[href*='categor']").each(function () {
                        console.log($(this).closest("[class*='menu']"))
                        if ($(this).closest("div[id*='menu']").length === 0 && $(this).closest("[class*='menu']").length === 0 && $(this).closest("[class*='aside']").length === 0 && $(this).closest("[class*='header']").length === 0) {
                            console.log($(this).text());
                            tags.push($(this).text());
                        }
                    })
                }

                if (tqgs) {
                    $("a[href*='keyword']").each(function () {
                        if ($(this).closest("div[id*='menu']").length === 0 && $(this).closest("[class*='menu']").length === 0 && $(this).closest("[class*='aside']").length === 0 && $(this).closest("[class*='header']").length === 0) {
                            console.log($(this).text());
                            tags.push($(this).text());
                        }
                    })
                }

                if (tOgs) {
                    $("a[href*='tags']").each(function () {
                        if ($(this).closest("div[id*='menu']").length === 0 && $(this).closest("[class*='menu']").length === 0 && $(this).closest("[class*='aside']").length === 0 && $(this).closest("[class*='header']").length === 0) {
                            console.log($(this).text());
                            tags.push($(this).text());
                        }
                    })
                }

                if (tIgs) {
                    $("a[href*='search?search']").each(function () {
                        if ($(this).closest("div[id*='menu']").length === 0 && $(this).closest("[class*='menu']").length === 0 && $(this).closest("[class*='aside']").length === 0 && $(this).closest("[class*='header']").length === 0) {
                            console.log($(this).text());
                            tags.push($(this).text());
                        }
                    })
                }

                var title = $("title").text();
                var sourceEmbed;
                if (newHtml.length < 2) {
                    sourceEmbed = newHtml[0];
                } else {
                    sourceEmbed = newHtml[0];
                }



                var uniqueTags = [];
                tags.forEach(function (item) {
                    if (uniqueTags.indexOf(item) < 0) {
                        uniqueTags.push(item);
                    }
                });

                cb(sourceEmbed, title, uniqueTags);


                    uniqueTags.forEach(function (element) {
                        tagsBase.getBy('tag.tagName', element, function(err,tag){
                            if(tag.length >0) {
                                console.log("tag already in base");
                            } else {
                                console.log(tag);
                                var newTag = {};
                                newTag.tagName = element;
                                newTag.timestamp = new Date();

                                tagsBase.create(newTag, function (err, tag) {
                                    console.log(tag);
                                    console.log(err);
                                    if (err)
                                        return next(err);
                            })
                            }
                        })



                    })
             


            } catch (e) {
                console.log(e);
            }
        })
        .catch(function (err) {
            console.log(err);
            // rejected
        });

}

Crawler.addModalDiv = function (url, originalUrl) {
    console.log(originalUrl);
    var html2 = '<div class="col-12 flex-wrap" id="cell0x0" >' +
        '<!-- <div class="pl-4" style="border: rgb(19, 161, 243); border-width: 2px; border-style: ridge; padding: 3px; border-radius: 0.9vh; background-color: rgb(175, 213, 238);"> -->' +
        '<div class="row col-12 embed-responsive embed-responsive-16by9">' +
        '<iframe class="embed-responsive-item" src="' + url + '" frameborder="0" allow="autoplay; encrypted-media"' +
        'allowfullscreen id="modalEmbedVideoId">' +
        '</iframe>' +
        '<input type="hidden" id="hiddenURl" value="' + originalUrl + '">' +
        '<button type="button" value="Edit" class="col-2 btn btn-sm btn-primary " style="border-radius: 100vh;" onclick="expandIframe(0,0)">EX</button>' +
        '</div>' +

        '<div class="row col-12 flex-wrap" style="border: rgb(19, 161, 243); border-width: 2px; border-style: ridge; padding: 3px; border-radius: 0.9vh; background-color: rgb(175, 213, 238);">' +
        '<div class="row col-12 flex-wrap">' +

        // '<button class="col-2 btn btn-sm btn-primary" type="button" data-toggle="collapse" data-target="#demo" aria-controls="nav-inner-primary"' +
        // 'aria-expanded="false" aria-label="Toggle navigation" style="margin-left: 20px;">' +
        // '<span class="navbar-toggler-icon">V</span>' +
        // '</button>' +
        // '<input class="col-6 form-control" placeholder="Search" type="text" style="width: 80%;">' +


        '<button class="col-2 btn btn-sm btn-primary" type="button" data-toggle="collapse" data-target="#demo0' +
        '" aria-controls="nav-inner-primary"' +
        'aria-expanded="false" aria-label="Toggle navigation" >' +
        '<span class="navbar-toggler-icon"><span class="btn-inner--icon"'+
        'data-toggle="tooltip" data-placement="top" title="Consult the list of criterii applying to this video" '+
        '>' +
        '<i class="ni ni-bold-down"></i>' +
        "</span></span>" +
        "</button>" +

        '<input class="col-6 form-control" placeholder="Search" type="text" style="width: 80%;" id="searchVideoBar0" ' +
        'onkeyUp="filterCriterion(event,0' +
        ' )"'+
        '>' +  









        // '<button type="button" value="Edit" class="col-2 btn btn-sm btn-primary " style="border-radius: 100vh;">S</button>' +
        
        '<span class="input-group-btn">' +
        '<button type="submit" class="btn btn-primary "' +
        'data-toggle="tooltip" data-placement="top" title="Here you can check whether this video is already rated with the given criterion. '+
        'If not then you can add it to the list"'+
        'id="filterAddCriterion_0' +
        '" onclick=addVideoSearchCriterion(0)>' +
        "ADD" +
        "</button>" +
        "</span>" +
        
        
        
        
        
        '</div>' +

        // '<div id="demo" class="collapse col-12" style="max-height: 50vh; overflow:auto">' +
        // '<div class="container-fluid justify-content-center" style="float: left;" id="progressBarContainer0">' +

        // '</div>' +

        // '<input type="button" class="btn btn-sm btn-primary" onclick="add_criterion(0)" value="Add" >' +
        // '</div>' +


        '<div id="demo0' +
        '" class="collapse col-12" style="max-height: 50vh; overflow:auto; ">' +
        '<div class="container-fluid justify-content-center" style="float: left;" id="progressBarContainer0' +
        '">' +
        "</div>" +
        "</div>" +

        '</div>' +
        '</div>';

        // var html2 =
        // '<div class="row col-12 embed-responsive embed-responsive-16by9">' +
        // '<iframe class="embed-responsive-item" src="' +
        // url +
        // '" frameborder="0" allow="autoplay; encrypted-media"' +
        // 'allowfullscreen id="modalEmbedVideoId">' +
        // "</iframe>" +
        // '<input type="hidden" id="hiddenURl" value="' +
        // originalUrl +
        // '">' +
        // '<button type="button" value="Edit" class="col-2 btn btn-sm btn-primary " style="border-radius: 100vh;right:-50%;" onclick="expandIframe(0,0)"'+
        // 'data-toggle="tooltip" data-placement="top" title="Expand this video to a greater size" '+
        // ' ><span class="btn-inner--icon">' +
        // '<i class="ni ni-tv-2"></i></button>' +
        // "</span></button>" +
        // "</div>" +
        // '<div class="row col-12 flex-wrap" style="border: rgb(19, 161, 243); border-width: 2px; border-style: ridge; padding: 3px; border-radius: 0.9vh; background-color: rgb(175, 213, 238);">' +
        // '<div class="row col-12 flex-wrap">' +
        // '<button class="col-2 btn btn-sm btn-primary" type="button" data-toggle="collapse" data-target="#demo0' +
        // '" aria-controls="nav-inner-primary"' +
        // 'aria-expanded="false" aria-label="Toggle navigation" >' +
        // '<span class="navbar-toggler-icon"><span class="btn-inner--icon"'+
        // 'data-toggle="tooltip" data-placement="top" title="Consult the list of criterii applying to this video" '+
        // '>' +
        // '<i class="ni ni-bold-down"></i></button>' +
        // "</span></span>" +
        // "</button>" +

        // '<input class="col-6 form-control" placeholder="Search" type="text" style="width: 80%;" id="searchVideoBar0' +
        // 'onkeyUp="filterCriterion(event,0' +
        // ' )"'+
        // '>' +
        // // '<div class="input-group">'+
        // '<span class="input-group-btn">' +
        // '<button type="submit" class="btn btn-primary "' +
        // 'data-toggle="tooltip" data-placement="top" title="Here you can check whether this video is already rated with the given criterion. '+
        // 'If not then you can add it to the list"'+
        // 'id="filterAddCriterion_0' +
        // '" onclick=addVideoSearchCriterion(0)>' +
        // "ADD" +
        // "</button>" +
        // "</span>" +
        // // "</div>" +
        // '<div id="demo0' +
        // '" class="collapse col-12" style="max-height: 50vh; overflow:auto; ">' +
        // '<div class="container-fluid justify-content-center" style="float: left;" id="progressBarContainer0' +
        // '">' +
        // "</div>" +
        // "</div>" +
        // "</div>";



    return html2;
}