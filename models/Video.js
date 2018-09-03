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
			'MATCH (video:video)', 'WHERE ' + field + ' = {value}', 'RETURN video',
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
Video.create = function (data, tags, callback) {
	console.log(data);

	if (tags) {
		Video.computeQuery(data, tags, function (quer) {
			console.log(quer);
			var qp = {
				query: [
					quer
				],
				params: {
					data: data,
				}

			}

			console.log(qp);

			db.cypher(qp, function (err, results) {
				if (err) return callback(err);
				callback(null, results[0]['video']);
				console.log(results);
			});

		})

	} else {
		var qp = {
			query: [
				'CREATE (video:Video {data})',
				'RETURN video',
			].join('\n'),
			params: {
				data: data,
			}
		}
		console.log('after query');
		console.log(qp);
		db.cypher(qp, function (err, results) {
			if (err) return callback(err);
			callback(null, results[0]['video']);
			console.log(results);
		});
	}

};

Video.getAll = function (callback) {
	var qp = {
		query: [
			'MATCH (video:Video)',
			'RETURN video',
			'LIMIT 100'
		].join('\n')
	}

	db.cypher(qp, function (err, result) {
		if (err) return callback(err);
		callback(null, result);
	});
};

Video.computeQuery = function (data, tags, callback) {

	var quer ="";
	var i = 0;
	for (var prop in tags) {
		if (tags.hasOwnProperty(prop)) {
			console.log(prop);
			quer += 'MATCH (tag' + i + ':Tag) WHERE tag' + i + '.name = "' + tags["tag" + i].tagName + '",\n';
			i++;
		}
	}


	quer += 'CREATE (video:Video {data}),\n';


	var i = 0;
	for (var prop in tags) {
		if (tags.hasOwnProperty(prop)) {
			console.log(prop);
			quer += '(video)-[:RATED {level:' + tags["tag" + i].tagValue + '}]->(tag' + i + '),\n';
			quer += '(tag' + i + ')-[:DEFINES {level:' + tags["tag" + i].tagValue + '}]->(video),\n';	
			i++;
		}
	}




	callback(quer);

}