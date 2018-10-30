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
  
  console.log(quer);
  db.cypher(quer, function(err, results) {
    console.log(results);
    if (err) return callback(err);

    if (results.length != 0) {
      HomePageL.buildIframe(null, results, function(videos) {
        if (err) return callback(err);
        callback(videos);
      });
    }
  });
};

HomePageL.buildIframe = function(err, results, callback) {
  var array = [];
  var i = 0;
  if (results.length === 0) {
    callback(null);
  } else {
    for (var prop in results) {
      if (results.hasOwnProperty(prop)) {
        var quer2 =
          "MATCH p=(v:Video)-[r:RATED]->(t:Tag) WHERE ID(v)=" +
          results[prop].v._id +
          " RETURN p, v , t, r";

        db.cypher(quer2, function(err, result2) {
          var test = "test";

          if (err) return callback(err);

          var video = {};
          // padding: 3px;
          var html2 =
          '<div class="flex-wrap" style="border: rgb(19, 161, 243); border-width: 2px; border-style: ridge; border-radius: 0.9vh; background-color: rgb(175, 213, 238);">' +
            '<div class="embed-responsive embed-responsive-16by9">' +
            '<iframe class="embed-responsive-item" src="' +
            result2[0].v.properties.embedUrl +
            '" frameborder="0" allow="autoplay; encrypted-media"' +
            'allowfullscreen id="modalEmbedVideoId">' +
            "</iframe>" +
            '<input type="hidden" id="hiddenURl" value="' +
            result2[0].v.properties.originalUrl +
            '">' +
            '<button type="button" value="Edit" class="col-2 btn btn-sm btn-primary " style="border-radius: 100vh;right:-80%;" onclick="expandIframe(' +
            result2[0].v._id +')" '+
            'data-toggle="tooltip" data-placement="top" title="Expand this video to a greater size" '+
            ' id="expandButton'+result2[0].v._id+'"><span class="btn-inner--icon">' +
            '<i class="ni ni-tv-2"></i></button>' +
            "</span></button>" +
            "</div>" +

            
            '<div class="flex-wrap">' +

            '<div class="input-group">'+
            '<input class="form-control" placeholder="Search" type="text" id="searchVideoBar' +
            result2[0].v._id +'"'+
            'onkeyUp="filterCriterion(event,' +
            result2[0].v._id +
            ' )"'+
            '>' +
            '<span class="input-group-btn">' +
            '<button type="submit" class="btn btn-primary "' +
            'data-toggle="tooltip" data-placement="top" title="Here you can check whether this video is already rated with the given criterion. '+
            'If not then you can add it to the list"'+
            'id="filterAddCriterion_' +
            result2[0].v._id +
            '" onclick=addVideoSearchCriterion('+result2[0].v._id+')>' +
            "ADD" +
            "</button>" +
            "</span>" +
            '<span class="input-group-btn">' +
            '<button class="btn btn-neutral" type="button" data-toggle="collapse" data-target="#demo' +
            result2[0].v._id +
            '" aria-controls="nav-inner-primary"' +
            'aria-expanded="false" aria-label="Toggle navigation" >' +
            '<span class="navbar-toggler-icon"><span class="btn-inner--icon"'+
            'data-toggle="tooltip" data-placement="top" title="Consult the list of criterii applying to this video" '+
            '>' +
            '<i class="ni ni-bold-down"></i></button>' +
            "</span></span>" +
            "</button>" +
            "</span>" +
            "</div>" +

            '<div id="demo' +
            result2[0].v._id +
            '" class="collapse col-12" style="max-height: 50vh; overflow:auto; ">' +
            '<div class="container-fluid justify-content-center" style="float: left;" id="progressBarContainer' +
            result2[0].v._id +
            '">' +
            "</div>" +
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
  }
};
