var neo4j = require("neo4j");
var db = new neo4j.GraphDatabase("http://neo4j:mafrax@localhost:7474");

// private constructor:
var HomePageL = module.exports = function HomePageL(_node) {
  // all we'll really store is the node; the rest of our properties will be
  // derivable or just pass-through properties (see below).
  this._node = _node;
}

HomePageL.loadHomePage = function(callback) {
  console.log(callback);
  quer = "MATCH p=(v:Video)-[r:RATED]->(t:Tag) RETURN p, v , t, r";
  console.log(quer);
  db.cypher(quer, function(err, results) {
    if (err) return callback(err);
    HomePageL.buildIframe(null, results, callback);
    console.log(results);
  });
};

HomePageL.buildIframe = function(err, results, callback) {
  console.log("YOUHOU");

  for (var prop in results) {
    if (results.hasOwnProperty(prop)) {
      var html2 =
        '<div class="col-12 flex-wrap" id="cell'+ results[prop].v._id +'" >' +
        '<!-- <div class="pl-4" style="border: rgb(19, 161, 243); border-width: 2px; border-style: ridge; padding: 3px; border-radius: 0.9vh; background-color: rgb(175, 213, 238);"> -->' +
        '<div class="row col-12 embed-responsive embed-responsive-16by9">' +
        '<iframe class="embed-responsive-item" src="' +  results[prop].v.properties.embedUrl +
        '" frameborder="0" allow="autoplay; encrypted-media"' +
        'allowfullscreen id="modalEmbedVideoId">' +
        "</iframe>" +
        '<input type="hidden" id="hiddenURl" value="' +
        results[prop].v.properties.originalUrl +
        '">' +
        '<button type="button" value="Edit" class="col-2 btn btn-sm btn-primary " style="border-radius: 100vh;" onclick="expandIframe('+ results[prop].v._id +')">EX</button>' +
        "</div>" +
        '<div class="row col-12 flex-wrap" style="border: rgb(19, 161, 243); border-width: 2px; border-style: ridge; padding: 3px; border-radius: 0.9vh; background-color: rgb(175, 213, 238);">' +
        '<!-- <button class="row col-12 btn btn-sm btn-primary" data-toggle="collapse" data-target="#demo"> -->' +
        "<!-- </button> -->" +
        '<div class="row col-12 flex-wrap">' +
        '<button class="col-2 btn btn-sm btn-primary" type="button" data-toggle="collapse" data-target="#demo" aria-controls="nav-inner-primary"' +
        'aria-expanded="false" aria-label="Toggle navigation" style="margin-left: 20px;">' +
        '<span class="navbar-toggler-icon">V</span>' +
        "</button>" +
        '<input class="col-6 form-control" placeholder="Search" type="text" style="width: 80%;">' +
        '<button type="button" value="Edit" class="col-2 btn btn-sm btn-primary " style="border-radius: 100vh;">S</button>' +
        "</div>" +
        '<div id="demo" class="collapse" style="max-height: 50vh; overflow:auto">' +
        '<div class="container-fluid justify-content-center" style="float: left;" id="progressBarContainer'+ results[prop].v._id +'">' +
        "</div>" +
        '<input type="button" class="btn btn-sm btn-primary" onclick="add_criterion('+ results[prop].v._id +', "new criterion")" value="Add" >' +
        "</div>" +
        "</div>" +
        "</div>";

        callback(html2);

    }
  }
};
