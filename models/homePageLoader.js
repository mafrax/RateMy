var neo4j = require("neo4j");
var db = new neo4j.GraphDatabase("http://neo4j:mafrax@5.39.80.142:7474");

// private constructor:
var HomePageL = (module.exports = function HomePageL(_node) {
  // all we'll really store is the node; the rest of our properties will be
  // derivable or just pass-through properties (see below).
  this._node = _node;
});

HomePageL.loadHomePage = function(callback) {
  // quer = "MATCH (v:Video) Where (v)-[:RATED]->(:Tag) Return v";
  quer = "MATCH p=(v:Video)-[r:RATED]->(t:Tag)  Return r,t,v ORDER BY v.timeStamp DESC";

  // console.log(quer);
  
  // console.log("quer");
  db.cypher(quer, function(err, results) {
    // console.log(results);
    // console.log(err);
    if (err) return callback(err, results);

    var localArray = createArray(results);
    // console.log(localArray);
    callback(localArray);

  });
};

function createArray(results) {
  var localArray = {};
  var i = 0;
  // console.log("in create aray");
  for (var prop in results) {

    if (results.hasOwnProperty(prop)) {
      
      if (prop > 0 && results[prop].v._id !== results[prop - 1].v._id) {
        // console.log(results[prop].v._id);
        // console.log(results[prop-1].v._id);
      function filtrerParID(obj) {
          const newLocal_1 = results[prop].v._id;
          const newLocal = obj.v._id;
          // Si c'est un nombre
          if (newLocal === newLocal_1) {
            // console.log("LOCAL ARRAY1: " + "Found");
            return true;
          }
          else {
            return false;
          }
        }
        var arrByID = results.filter(filtrerParID);
        // console.log("LOCAL ARRAY Id: " + results[prop].v);
        var newObject = { video: results[prop].v, tags: arrByID };
        // console.log("LOCAL ARRAY2: " + results[prop].v);
        localArray["video_" + results[prop].v._id] = newObject;
      }

      if(prop == 0 ){
        function filtrerParID(obj) {
          const newLocal_1 = results[prop].v._id;
          const newLocal = obj.v._id;
          // Si c'est un nombre
          if (newLocal === newLocal_1) {
            // console.log("LOCAL ARRAY1: " + "Found");
            return true;
          }
          else {
            return false;
          }
        }
        var arrByID = results.filter(filtrerParID);
        // console.log("LOCAL ARRAY Id: " + results[prop].v);
        var newObject = { video: results[prop].v, tags: arrByID };
        // console.log("LOCAL ARRAY2: " + results[prop].v);
        localArray["video_" + results[prop].v._id] = newObject;
      }
      // console.log(prop);
    }
  }
  return localArray;
}
