var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://neo4j:mafrax@localhost:7474');
var bcrypt = require('bcrypt-nodejs');
var Criterion = require('./Tag');


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
			var qp = quer;

			console.log(qp);

			db.cypher(qp, function (err, results) {
				if (err) return callback(err);
				callback(null, results);
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

    Criterion.getAll( function(err, result){
        var quer ="";
        
        for (var prop in tags) {
            if (tags.hasOwnProperty(prop)) {
                console.log(prop);
                var no = prop.slice(3, prop.length);
                console.log(no);
       
            console.log(result);
            
            var found = result.find(function(element) {
                return element.tag.properties.tagName === tags[prop].tagName;
              });
            // console.log(found);
            if(found){
				// console.log(tags);
				// console.log(prop);
				// console.log(prop.length);
				// console.log(prop.slice(3, prop.length));
				
					quer += 'MATCH (tag' + no + ':Tag) WHERE tag' + no + '.tagName = "' + tags["tag" + no].tagName + '"\n'; 
					                
                } else {
                    console.log("not found");
                    quer += 'CREATE (tag' + no + ':Tag {tagName: "'+ tags["tag" + no].tagName+'"})\n';
                }
         
        }            
    }
            quer += 'CREATE (video:Video {embedUrl: "'+ data.embedUrl +'", originalUrl: "'+ data.originalUrl +'", timeStamp: timestamp(), title:"'+ data.title +'" })\n';
                
            var i = 0;
            for (var prop in tags) {
                if (tags.hasOwnProperty(prop)) {
                    console.log(prop);
                    quer += 'CREATE (video)-[:RATED {level:' + tags["tag" + i].tagValue + '}]->(tag' + i + ')\n';
                    i++;
                }
            }
        
        
        
        
            callback(quer);
            
    })


}