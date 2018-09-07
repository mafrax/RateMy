var neo4j = require("neo4j");
var db = new neo4j.GraphDatabase("http://neo4j:mafrax@localhost:7474");

// private constructor:
var HomePageL = (module.exports = function HomePageL(_node) {
  // all we'll really store is the node; the rest of our properties will be
  // derivable or just pass-through properties (see below).
  this._node = _node;
});

HomePageL.loadHomePage = function(callback) {
  console.log(callback);
  quer = "MATCH (v:Video) Where (v)-[:RATED]->(:Tag) Return v";
  console.log(quer);
  db.cypher(quer, function(err, results) {
    if (err) return callback(err);
    for (var prop in results) {
        if (results.hasOwnProperty(prop)) {
             HomePageL.buildIframe(null, results[prop], callback);
        }
    }
    console.log(results);
  });
};

HomePageL.buildIframe = function(err, results, callback) {
  console.log("YOUHOU");

  var html2 = 
  '<div class="row col-12 embed-responsive embed-responsive-16by9">' +
  '<iframe class="embed-responsive-item" src="' +
  results.v.properties.embedUrl +
  '" frameborder="0" allow="autoplay; encrypted-media"' +
  'allowfullscreen id="modalEmbedVideoId">' +
  "</iframe>" +
  '<input type="hidden" id="hiddenURl" value="' +
  results.v.properties.originalUrl +
  '">' +
  '<button type="button" value="Edit" class="col-2 btn btn-sm btn-primary " style="border-radius: 100vh;" onclick="expandIframe(' +
  results.v._id +
  ')"><span class="btn-inner--icon">'+
  '<i class="ni ni-tv-2"></i></button>'+
'</span></button>' +
  "</div>" +
  '<div class="row col-12 flex-wrap" style="border: rgb(19, 161, 243); border-width: 2px; border-style: ridge; padding: 3px; border-radius: 0.9vh; background-color: rgb(175, 213, 238);">' +
  '<div class="row col-12 flex-wrap">' +
  '<button class="col-2 btn btn-sm btn-primary" type="button" data-toggle="collapse" data-target="#demo' +
  results.v._id +
  '" aria-controls="nav-inner-primary"' +
  'aria-expanded="false" aria-label="Toggle navigation" style="margin-left: 20px;">' +
  '<span class="navbar-toggler-icon"><span class="btn-inner--icon">'+
  '<i class="ni ni-bold-down"></i></button>'+
'</span></span>' +
  "</button>" +
  '<input class="col-6 form-control" placeholder="Search" type="text" style="width: 80%;">' +
  '<button type="button" value="Edit" class="col-2 btn btn-sm btn-primary " style="border-radius: 100vh;">'+
  '<span class="btn-inner--icon">'+
                      '<i class="ni ni-zoom-split-in"></i></button>'+
                  '</span></button>' +
  "</div>" +
  '<div id="demo' +
  results.v._id +
  '" class="collapse col-12" style="max-height: 50vh; overflow:auto">' +
  '<div class="container-fluid justify-content-center" style="float: left;" id="progressBarContainer' +
  results.v._id +
  '">' +
  "</div>" +
  '<input type="button" class="btn btn-sm btn-primary" onclick="add_criterion(' +
  results.v._id +
  ')" value="Add" >' +
  "</div>" +
  "</div>";

      var quer2 =
        "MATCH p=(v:Video)-[r:RATED]->(t:Tag) WHERE ID(v)=" +
        results.v._id +
        " RETURN p, v , t, r";

      db.cypher(quer2, function(err, result2) {
        if (err) return callback(err);
        callback(html2, result2);
      });

};
