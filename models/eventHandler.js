var truc = require("pornhub");
var crawler = require('../models/crawl');
var Pornsearch = require('pornsearch');
var Searcher = new Pornsearch('tits');


exports = module.exports = function(io){
  io.sockets.on('connection', function (socket) {
    console.log('Un client est connecté !');
 
      // Quand le serveur reçoit un signal de type "message" du client    
      socket.on('message', function (message) {
          console.log('Un client me parle ! Il me dit : ' + message);

          crawler.crawl(message, function(url, title){
              // crawler.crawl(url2, function(url){
              console.log(url);
              console.log(title);
              var html = crawler.addModalDiv(url);
              console.log(html);
              socket.emit('message', {htmlfield: html, titlefield: title });                           
              });


      });	

  });




}