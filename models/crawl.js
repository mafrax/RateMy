var rp = require("request-promise");
var cheerio = require("cheerio");
var tagsBase = require("../models/Tag");

// private constructor:
var Crawler = (module.exports = function Crawler(_node) {
  // all we'll really store is the node; the rest of our properties will be
  // derivable or just pass-through properties (see below).
  this._node = _node;
});

Crawler.crawl = function(url, cb) {
  if (url.includes("?")) {
    var parts = url.split("?");
    // console.log(parts[0]);
    var qsArray = parts[1].split("=");
    var vK = qsArray[0];
    var vkValue = qsArray[1];
    var truc = vK.valueOf();

    // console.log(truc);

    var options = {
      uri: parts[0],
      qs: {
        // promo : vkValue // -> uri + '?access_token=xxxxx%20xxxxx'
      },
      headers: {
        "User-Agent": "Request-Promise"
      },
      json: true, // Automatically parses the JSON string in the response
      transform: function(body) {
        return cheerio.load(body);
      }
    };

    // console.log(options.qs);
    options.qs[vK.valueOf()] = vkValue;
  } else {
    var options = {
      uri: url,
      headers: {
        "User-Agent": "Request-Promise"
      },
      json: true, // Automatically parses the JSON string in the response
      transform: function(body) {
        return cheerio.load(body);
      }
    };
  }

  rp(options)
    .then(function($) {
      try {
        var p = $("meta[content*='embed'][content*='https']");
        var q = $("textarea:contains('iframe'):contains('embed')");
        var thumbnail = $("meta[content*='phncdn.com/videos/']");
        var truc = thumbnail[0];
        var truc2 = truc.attribs.content ;
        var index = truc2.indexOf(".jpg");
        var index2 = truc2.lastIndexOf(")");
        var startThumbnailsUrl = truc2.slice(0, index2+1);
        var originalNumThumbnailsUrl = parseInt(truc2.slice(index2+1, index));

        var thumbNails = [];
        var i;
for (i = 1; i <= originalNumThumbnailsUrl; i++) { 
  thumbNails[i] = startThumbnailsUrl + i + ".jpg";
}

        console.log(thumbNails);

        var newHtml = [];

        if (p.length > 0) {
          $("meta[content*='embed'][content*='https']").each(function() {
            // console.log($(this).attr().content);
            newHtml.push($(this).attr().content);
          });
        } else if (q) {
          $("textarea:contains('iframe'):contains('embed')").each(function() {
            var sub = $(this)
              .text()
              .substring(
                $(this)
                  .text()
                  .indexOf("src=") + 5,
                $(this).text().length - 1
              );
            var subsub = sub.substring(0, sub.indexOf('"'));
            // console.log(subsub)
            newHtml.push(subsub);
          });
        }

        if (newHtml.length === 0) {
            cb(null, "Sorry, video not found", null);          
        } else {
            // var r = $("textarea:contains('iframe')")[0].childNodes[0].data;
          var tqgs = $("a[href*='keyword']");
          var tpgs = $("a[href*='categor']");
          var tOgs = $("a[href*='tags']");
          var tIgs = $("a[href*='search?search']");

          var tags = [];

          if (tpgs) {
            $("a[href*='categor']").each(function() {
              // console.log($(this).closest("[class*='menu']"));
              if (
                $(this).closest("div[id*='menu']").length === 0 &&
                $(this).closest("[class*='menu']").length === 0 &&
                $(this).closest("[class*='aside']").length === 0 &&
                $(this).closest("[class*='header']").length === 0
              ) {
                // console.log($(this).text());
                tags.push($(this).text());
              }
            });
          }

          if (tqgs) {
            $("a[href*='keyword']").each(function() {
              if (
                $(this).closest("div[id*='menu']").length === 0 &&
                $(this).closest("[class*='menu']").length === 0 &&
                $(this).closest("[class*='aside']").length === 0 &&
                $(this).closest("[class*='header']").length === 0
              ) {
                // console.log($(this).text());
                tags.push($(this).text());
              }
            });
          }

          if (tOgs) {
            $("a[href*='tags']").each(function() {
              if (
                $(this).closest("div[id*='menu']").length === 0 &&
                $(this).closest("[class*='menu']").length === 0 &&
                $(this).closest("[class*='aside']").length === 0 &&
                $(this).closest("[class*='header']").length === 0
              ) {
                tags.push($(this).text());
              }
            });
          }

          if (tIgs) {
            $("a[href*='search?search']").each(function() {
              if (
                $(this).closest("div[id*='menu']").length === 0 &&
                $(this).closest("[class*='menu']").length === 0 &&
                $(this).closest("[class*='aside']").length === 0 &&
                $(this).closest("[class*='header']").length === 0
              ) {
                // console.log($(this).text());
                tags.push($(this).text());
              }
            });
          }

          var title = $("title").text();
          var sourceEmbed;
          if (newHtml.length < 2) {
            sourceEmbed = newHtml[0];
          } else {
            sourceEmbed = newHtml[0];
          }

          var uniqueTags = [];
          tags.forEach(function(item) {
            if (uniqueTags.indexOf(item) < 0) {
              uniqueTags.push(item);
            }
          });



          cb(sourceEmbed, title, uniqueTags, thumbNails);

          uniqueTags.forEach(function(element) {
            tagsBase.getBy("tag.tagName", element, function(err, tag) {
                // console.log("tag "+tag);
                // console.log("error "+err);
                if (err!=null && tag !== "undefined") {
                  // console.log("tag already in base");
                } else {
                  // console.log(tag);
                  var newTag = {};
                  newTag.tagName = element;
                  newTag.timestamp = new Date();
  
                  tagsBase.create(newTag, function(err, tag) {
                    // console.log(tag);
                    // console.log(err);
                    if (err) return next(err);
                  });
                }
              
            });
          });
        }
      } catch (e) {
        // console.log(e);
      }
    })
    .catch(function(err) {
      // console.log(err);
      // rejected
    });
};

Crawler.addModalDiv = function(url, originalUrl, thumbNails) {
  // console.log(originalUrl);

  if(url==null){
      return "We are very sorry, but we couldn't find any embed video on this page. Please make sure you used the correct link or send us an email with the link and we will try our best to troubleshoot your problem";
  }

  var htmlThumbs = "<div class='col-12'>";
  if(thumbNails != null){
    var i;
    var length = thumbNails.length;
    for (i = 1; i<length ; i++){
      htmlThumbs += '<img class="vidThumb" src="'+thumbNails[i]+'" data-thumb_url="'+thumbNails[i]+'" width="80" >';
    }
  }
  htmlThumbs += '</div>';
  var html2 =
    '<div class="col-12 flex-wrap" id="cell0x0" >' +
    '<div class="embed-responsive embed-responsive-16by9">' +
    '<iframe class="embed-responsive-item" src="' +
    url +
    '" frameborder="0" allow="autoplay; encrypted-media"' +
    'allowfullscreen id="modalEmbedVideoId">' +
    "</iframe>" +
    '<input type="hidden" id="hiddenURl" value="' +
    originalUrl +
    '">' +
    "</div>" +
    htmlThumbs +
    '<div class="flex-wrap" style="border: rgb(19, 161, 243); border-width: 2px; border-style: ridge; border-radius: 0.9vh; background-color: rgb(175, 213, 238);">' +
    '<div class="input-group">' +
    '<input class="form-control" placeholder="Search" type="text" id="searchVideoBar0' +
    '"' +
    'onkeyUp="filterCriterion(event,' +
    "0" +
    ' )"' +
    ">" +
    '<span class="input-group-btn">' +
    '<button type="submit" class="btn btn-block btn-primary "' +
    'data-toggle="tooltip" data-placement="top" title="Here you can check whether this video is already rated with the given criterion. ' +
    'If not then you can add it to the list"' +
    'id="filterAddCriterion_' +
    "0" +
    '" onclick=addVideoSearchCriterion(0)>' +
    "ADD" +
    "</button>" +
    "</span>" +
    '<span class="input-group-btn">' +
    '<button class="btn btn-neutral" type="button" data-toggle="collapse" data-target="#demo' +
    "0" +
    '" aria-controls="nav-inner-primary"' +
    'aria-expanded="false" aria-label="Toggle navigation" >' +
    '<span class="navbar-toggler-icon"><span class="btn-inner--icon"' +
    'data-toggle="tooltip" data-placement="top" title="Consult the list of criterii applying to this video" ' +
    ">" +
    '<i class="ni ni-bold-down"></i></button>' +
    "</span></span>" +
    "</button>" +
    "</span>" +
    "</div>" +
    '<div id="demo0' +
    '" class="collapse col-12" style="max-height: 50vh; overflow:auto; ">' +
    '<div class="container-fluid justify-content-center" style="float: left;" id="progressBarContainer0' +
    '">' +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>";


  return html2;
};
