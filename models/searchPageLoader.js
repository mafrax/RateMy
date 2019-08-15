var neo4j = require('neo4j')
var db = new neo4j.GraphDatabase('http://neo4j:mafrax@5.39.80.142:7474')

var rp = require('request-promise')
var cheerio = require('cheerio')

var tags = require('./Tag')

// private constructor:
var searchPageLoader = (module.exports = function searchPageLoader (_node) {
  // all we'll really store is the node; the rest of our properties will be
  // derivable or just pass-through properties (see below).
  this._node = _node
})

searchPageLoader.loadSearchPage = function (callback) {
//   var div = document.createElement('div')
//   var ol = document.createElement('ol')
//   div.appendChild(ol)
  tags.getAllWithCount(function (err, results) {
    // results.forEach(element => {
    //   var tag = document.createElement('li')
    //   tag.innerHTML(element)
    //   tag.setAttribute('href', '/' + element)
    //   ol.appendChild(tag)
    // })
    callback(err, results)
  })
}
