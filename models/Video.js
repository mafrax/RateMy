var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://neo4j:mafrax@localhost:7474');
var bcrypt = require('bcrypt-nodejs');

// private constructor:
var Video = module.exports = function Video(_node) {
	// all we'll really store is the node; the rest of our properties will be
	// derivable or just pass-through properties (see below).
	this._node = _node;
}

Video.getBy = function (field, value, callback) {
	console.log('entered getby');
	console.log(value);
	console.log(field);
	var qp = {
		query: [
			'MATCH (video:video)','WHERE ' + field + ' = {value}','RETURN video',
		]
		.join('\n')
		,
		params: {
			value: value
		}
	}
console.log(qp);
	db.cypher(qp, function (err, result) {
		if (err) return callback(err);
		if (!result[0]) {
			console.log('1');
			console.log(result[0]);
			callback(null, null);
		} else {
			console.log('2');
            console.log(result[0]);
			callback(null, result[0]['video']);
		}
	});
}

// creates the user and persists (saves) it to the db, incl. indexing it:
Video.create = function (data, callback) {
  console.log(data);
  Video.getAll(function(err, cities){
	var c = new Array();
	c = cities;
  })
	var qp = {
		query: [
            'CREATE (video:Video {data})',
			'RETURN video',
		].join('\n'),
		params: {
			data: data
		}
	}
	console.log('after query');
	console.log(qp);
	db.cypher(qp, function (err, results) {
        if (err) return callback(err);
		callback(null, results[0]['video']);
		console.log(results);
	});
};
