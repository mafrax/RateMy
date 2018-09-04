var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://neo4j:mafrax@localhost:7474');
var bcrypt = require('bcrypt-nodejs');

// private constructor:
var Tag = module.exports = function Tag(_node) {
	// all we'll really store is the node; the rest of our properties will be
	// derivable or just pass-through properties (see below).
	this._node = _node;
}

Tag.getBy = function (field, value, callback) {
	console.log('entered getby');
	console.log(value);
	console.log(field);
	var qp = {
		query: [
			'MATCH (tag:tag)','WHERE ' + field + ' = {value}','RETURN tag',
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
			callback(null, result[0]['tag']);
	});
}

// creates the user and persists (saves) it to the db, incl. indexing it:
Tag.create = function (data, callback) {
  console.log(data);

	var qp = {
		query: [
            'CREATE (tag:Tag {data})',
			'RETURN tag',
		].join('\n'),
		params: {
			data: data
		}
	}
	console.log('after query');
	console.log(qp);
	db.cypher(qp, function (err, results) {
        if (err) return callback(err);
		callback(null, results[0]['tag']);
		console.log(results);
	});
};

Tag.getAll = function (callback) {
	var qp = {
		query: [
			'MATCH (tag:Tag)',
			'RETURN tag'
		].join('\n')
	}

	db.cypher(qp, function (err, result) {
		if (err) return callback(err);
		callback(null, result);
	});
};