var neo4j = require('neo4j')
var db = new neo4j.GraphDatabase('http://neo4j:mafrax@5.39.80.142:7474')
var bcrypt = require('bcrypt-nodejs')
var Criterion = require('./Tag')

// private constructor:
var Video = module.exports = function Video (_node) {
  // all we'll really store is the node; the rest of our properties will be
  // derivable or just pass-through properties (see below).
  this._node = _node
}

Video.getBy = function (field, value, callback) {
  // // console.log('entered getby');
  // // console.log(value);
  // // console.log(field);
  var qp = {
    query: [
      'MATCH (video:video)', 'WHERE ' + field + ' = {value}', 'RETURN video'
    ]
      .join('\n'),
    params: {
      value: value
    }
  }
  // // console.log(qp);
  db.cypher(qp, function (err, result) {
    if (err) return callback(err)
    if (!result[0]) {
      // // console.log('1');
      // // console.log(result[0]);
      callback(null, null)
    } else {
      // // console.log('2');
      // // console.log(result[0]);
      callback(null, result[0]['video'])
    }
  })
}

Video.getLatestEntry = function (callback) {
  // // console.log('entered getby');
  // // console.log(value);
  // // console.log(field);
  var qp = {
    query: [
      'MATCH (video:Video)', 'RETURN video', 'ORDER BY video.timeStamp DESC LIMIT 1'
    ]
      .join('\n')
  }
  db.cypher(qp, function (err, result) {
    if (err) return callback(err)
    if (!result[0]) {
      // // console.log('1');
      // // console.log(result[0]);
      callback(null, null)
    } else {
      // // console.log('2');
      // // console.log(result[0]);
      callback(null, result[0]['video'])
    }
  })
}

Video.searchByCriterionLevel = function (tag, callback) {
  // // console.log('entered searchByCriterionLevel');

  // // console.log(tag);

  var truc = []
  var par = {}
  for (var prop in tag) {
    if (tag.hasOwnProperty(prop)) {
      truc.push('MATCH (v:Video)-[rel' + prop + ':RATED]->(t' + prop + ':Tag)')
      truc.push('WHERE t' + prop + '.tagName =~ {value' + prop + '}')
      truc.push('and rel' + prop + '.level>={lowerRange' + prop + '}')
      truc.push(' and rel' + prop + '.level<{higherRange' + prop + '}')
      par['value' + prop + ''] = '(?i)' + tag[prop].name
      par['lowerRange' + prop + ''] = tag[prop].lowerValue
      par['higherRange' + prop + ''] = tag[prop].higherValue
    }
  }

  truc.push('RETURN v')

  var qp = {
    // query: [
    // 	'MATCH (v:Video)-[rel:RATED]->(t:Tag)', 'WHERE t.tagName =~ {value}',' and rel.level>={lowerRange}',' and rel.level<{higherRange}',  'RETURN v',
    // ]
    // 	.join('\n')
    query:	truc.join('\n'),
    params: par
  }
  // // console.log(qp);
  db.cypher(qp, function (err, result) {
    if (err) return callback(err)
    if (!result[0]) {
      // // console.log('1');
      // // console.log(result);
      callback(null, result)
    } else {
      // // console.log('2');
      // // console.log(result);
      callback(null, result)
    }
  })
}

// creates the user and persists (saves) it to the db, incl. indexing it:
Video.create = function (data, tags, callback) {
  // // console.log("video create "+data);

  var size = Object.keys(tags).length
  // // console.log("into video Create: " + size)
  if (size > 0) {
    Video.computeQuery(data, tags, function (quer) {
      // // console.log("compute Query" +quer);
      var qp = quer
      db.cypher(qp, function (err, results) {
        if (err) {
          console.log(err);
          return callback(err)
        }
        // // console.log("Video CREATED "+results);
        callback(null, results)
        console.log(results);
      })
    })
  } else {
    // // console.log("2");
    var qp = {
      query: [
        'CREATE (video:Video {embedUrl: "' + data.embedUrl + '", originalUrl: "' + data.originalUrl + '", timeStamp: timestamp(), title:"' + data.title + '" })',
        'RETURN video'
      ].join('\n')
    }
    // // console.log('after query');
    // // console.log(qp);
    db.cypher(qp, function (err, results) {
      if (err) return callback(err)
      // // console.log("Video CREATED "+results[0]['video']);
      callback(null, results[0]['video'])
      // // console.log(results);
    })
  }
}

Video.getAll = function (callback) {
  var qp = {
    query: [
      'MATCH (video:Video)',
      'RETURN video'
    ].join('\n')
  }

  db.cypher(qp, function (err, result) {
    if (err) return callback(err)
    callback(null, result)
  })
}

Video.computeQuery = function (data, tags, callback) {
  var quer = ''
  // // console.log("inside compute query, criterion getAll: "+ result);
  if (data.thumbNails == null || data.thumbNails.length == 0) {
    quer += 'CREATE (video:Video {embedUrl: "' + data.embedUrl + '", originalUrl: "' + data.originalUrl + '", timeStamp: timestamp(), title:"' + data.title + '" }) \n'
  } else {
    if (data.webm !== null || data.webm.length !== 0) {
      quer += 'CREATE (video:Video {embedUrl: "' + data.embedUrl + '", originalUrl: "' + data.originalUrl + '", timeStamp: timestamp(), title:"' + data.title + '", thumbnails: "' + data.thumbNails + '", webM: "' + data.webm + '" }) \n'
    } else {
      quer += 'CREATE (video:Video {embedUrl: "' + data.embedUrl + '", originalUrl: "' + data.originalUrl + '", timeStamp: timestamp(), title:"' + data.title + '", thumbnails: "' + data.thumbNails + '" }) \n'
    }
  }

  for (var prop in tags) {
    if (tags.hasOwnProperty(prop)) {
      var no = prop.slice(3, prop.length)
      if (no === '') {
        console.log( tags[prop] )
        quer += 'MERGE(tag' + prop + ':Tag {tagName: "' + tags[prop] + '"}) \n'
      } else {
        quer += 'MERGE (tag' + no + ':Tag {tagName: "' + tags['tag' + no].tagName + '"}) \n'
      }
    }
  }

  for (var prop in tags) {
    if (tags.hasOwnProperty(prop)) {
      var no = prop.slice(3, prop.length)
      if (no === '') {
        quer += 'CREATE (video)-[:RATED {level:0}]->(tag' + prop + ') \n'
      } else {
        quer += 'CREATE (video)-[:RATED {level:' + tags['tag' + no].tagValue + '}]->(tag' + no + ') \n'
      }
    }
  }

  quer += 'return video;'
  console.log(quer)
  callback(quer)
}

Video.getCriterionWithRelAndTag = function (videoId, tagName, callback) {
  // // console.log('entered searchByCriterionLevel');

  var truc = []
  var par = {}
  truc.push('MATCH (v:Video)-[rel:RATED]->(t:Tag)')
  truc.push('WHERE t.tagName =~ {value}')
  truc.push('and ID(v) =' + videoId + '')
  truc.push('RETURN v,rel,t')
  par['value'] = '(?i)' + tagName

  var qp = {
    query:	truc.join('\n'),
    params: par
  }
  // // console.log(qp);
  db.cypher(qp, function (err, result) {
    if (err) return callback(err)
    // // console.log(result);
    if (!result[0]) {
      // // console.log('1');
      // // console.log(result);
      callback(null, result)
    } else {
      // // console.log('2');
      // // console.log(result);
      callback(null, result)
    }
  })
}

Video.updateRelationLevel = function (relId, relLevel, numberofVotes, levelUser, previous, callback) {
  // // console.log('entered searchByCriterionLevel');

  var newVotes = numberofVotes + 1
  var roundedNumber = Math.round(relLevel * 10) / 10
  var roundedUserNumber = Math.round(levelUser * 10) / 10
  var newLevel = ((roundedNumber * numberofVotes) + roundedUserNumber) / newVotes

  var roundednewLevel = Math.round(newLevel * 10) / 10

  var truc = []
  var par = {}
  truc.push('MATCH (v:Video)-[rel:RATED]->(t:Tag)')
  truc.push('WHERE ID(rel) =' + relId + '')
  truc.push('SET rel.level = ' + roundednewLevel + ' , rel.votes = ' + newVotes + ', rel.previousLevel = ' + previous + '')
  truc.push('RETURN rel')

  var qp = {
    query:	truc.join('\n'),
    params: par
  }
  // // console.log(qp);
  db.cypher(qp, function (err, result) {
    if (err) return callback(err)
    // // console.log(result);
    if (!result[0]) {
      // // console.log('1');
      // // console.log(result);
      callback(null, result)
    } else {
      // // console.log('2');
      // // console.log(result);
      callback(null, result)
    }
  })
}

Video.resetRelationLevel = function (relId, relLevel, numberofVotes, callback) {
  // // console.log('entered searchByCriterionLevel');

  var newVotes = numberofVotes - 1

  var truc = []
  var par = {}
  truc.push('MATCH (v:Video)-[rel:RATED]->(t:Tag)')
  truc.push('WHERE ID(rel) =' + relId + '')
  truc.push('SET rel.level = ' + relLevel + ' , rel.votes = ' + newVotes + '')
  truc.push('RETURN rel')

  var qp = {
    query:	truc.join('\n'),
    params: par
  }
  // // console.log(qp);
  db.cypher(qp, function (err, result) {
    if (err) return callback(err)
    // // console.log(result);
    if (!result[0]) {
      // // console.log('1');
      // // console.log(result);
      callback(null, result)
    } else {
      // // console.log('2');
      // // console.log(result);
      callback(null, result[0])
    }
  })
}

Video.createRelationShipWithTag = function (vId, relLevel, tId, callback) {
  var truc = []
  var par = {}
  truc.push('MATCH (v:Video), (t:Tag)')
  truc.push('WHERE ID(v) =' + vId + ' and ID(t) =' + tId + '')
  truc.push('CREATE (v)-[rel:RATED {level:' + relLevel + '}]->(t)')
  truc.push('RETURN rel')

  var qp = {
    query:	truc.join('\n'),
    params: par
  }
  // // console.log(qp);
  db.cypher(qp, function (err, result) {
    if (err) return callback(err)
    // // console.log(result);
    if (!result[0]) {
      // // console.log('1');
      // // console.log(result);
      callback(null, result)
    } else {
      // // console.log('2');
      // // console.log(result);
      callback(null, result[0])
    }
  })
}

Video.getAllVideosRelatedToTag = function (tagName, callback) {
  var quer = 'MATCH (tag: Tag{ tagName: "' + tagName + '" })--(v:Video) WITH v MATCH p=(v)-[rel]->(t:Tag) return nodes(p) as nodes, relationships(p) as r'


  db.cypher(quer, function (err, results) {
	if (err) {
	  // console.log(err);
	  return callback(err)
	}
	// // console.log("Video CREATED "+results);
	callback(null, results)
	// // console.log(results);
  })

}
