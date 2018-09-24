var neo4j = require("neo4j");
var db = new neo4j.GraphDatabase("http://neo4j:mafrax@localhost:7474");

// private constructor:
var HomePageL = (module.exports = function HomePageL(_node) {
  // all we'll really store is the node; the rest of our properties will be
  // derivable or just pass-through properties (see below).
  this._node = _node;
});

HomePageL.loadHomePage = function(callback) {
  quer = "MATCH (v:Video) Where (v)-[:RATED]->(:Tag) Return v";

  db.cypher(quer, function(err, results) {
    if (err) return callback(err);
    HomePageL.buildIframe(null, results, function(videos) {
      if (err) return callback(err);
      callback(videos);
    });
  });
};

HomePageL.buildIframe = function(err, results, callback) {

  var array = [];
  var i = 0;
  for (var prop in results) {
    if (results.hasOwnProperty(prop)) {
      var quer2 =
        "MATCH p=(v:Video)-[r:RATED]->(t:Tag) WHERE ID(v)=" +
        results[prop].v._id +
        " RETURN p, v , t, r";

      db.cypher(quer2, function(err, result2) {
        if (err) return callback(err);

        var video = {};

        var html2 =
          '<div class="row col-12 embed-responsive embed-responsive-16by9">' +
          '<iframe class="embed-responsive-item" src="' +
          result2[0].v.properties.embedUrl +
          '" frameborder="0" allow="autoplay; encrypted-media"' +
          'allowfullscreen id="modalEmbedVideoId">' +
          "</iframe>" +
          '<input type="hidden" id="hiddenURl" value="' +
          result2[0].v.properties.originalUrl +
          '">' +
          '<button type="button" value="Edit" class="col-2 btn btn-sm btn-primary " style="border-radius: 100vh;right:-50%;" onclick="expandIframe(' +
          result2[0].v._id +
          ')"><span class="btn-inner--icon">' +
          '<i class="ni ni-tv-2"></i></button>' +
          "</span></button>" +
          "</div>" +
          '<div class="row col-12 flex-wrap" style="border: rgb(19, 161, 243); border-width: 2px; border-style: ridge; padding: 3px; border-radius: 0.9vh; background-color: rgb(175, 213, 238);">' +
          '<div class="row col-12 flex-wrap">' +
          '<button class="col-2 btn btn-sm btn-primary" type="button" data-toggle="collapse" data-target="#demo' +
          result2[0].v._id +
          '" aria-controls="nav-inner-primary"' +
          'aria-expanded="false" aria-label="Toggle navigation" style="margin-left: 20px;">' +
          '<span class="navbar-toggler-icon"><span class="btn-inner--icon">' +
          '<i class="ni ni-bold-down"></i></button>' +
          "</span></span>" +
          "</button>" +
          '<input class="col-6 form-control" placeholder="Search" type="text" style="width: 80%;">' +
          '<button type="button" value="Edit" class="col-2 btn btn-sm btn-primary " style="border-radius: 100vh;">' +
          '<span class="btn-inner--icon">' +
          '<i class="ni ni-zoom-split-in"></i></button>' +
          "</span></button>" +
          "</div>" +
          '<div id="demo' +
          result2[0].v._id +
          '" class="collapse col-12" style="max-height: 50vh; overflow:auto; ">' +
          '<div class="container-fluid justify-content-center" style="float: left;" id="progressBarContainer' +
          result2[0].v._id +
          '">' +
          "</div>" +
          '<div class="input-group">' +
          '<input type="text" placeholder="new criterion" class="col-8 form-control" name="criterionAddField" id="criterionAddField' +
          result2[0].v._id +
          '" />' +
          '<span class="input-group-btn">' +
          '<button type="button" class="btn btn-primary " onclick="add_criterion(' +
          result2[0].v._id +
          ')"">' +
          "Add" +
          "</button>" +
          "</span>" +
          "</div>" +
          '<input type="button" class="btn btn-sm btn-primary" value="Validate" >' +
          "</div>" +
          "</div>";

        video["iframe"] = html2;
        video["video"] = result2;
        array.push(video);

        if (i === results.length - 1) {
          callback(array);
        }
        i++;
      });
    }
  }
};
