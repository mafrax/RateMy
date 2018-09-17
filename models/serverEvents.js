
var crawler = require('../models/crawl');
var pageLoader = require('../models/homePageLoader');
var video = require('../models/Video');
var tag = require('../models/Tag');
var pass = require('../config/passport');
var neo4j = require("neo4j");
var db = new neo4j.GraphDatabase("http://neo4j:mafrax@localhost:7474");

var serverEvents = module.exports = function(io){
  io.sockets.on('connection', function (socket) {

    tag.getAll(function(err, result2){
      console.log(result2);
      socket.emit('searchResults', result2);
    })

    console.log('Un client est connecté !');
    
    pageLoader.loadHomePage(function(videoWithTags){    
     
      console.log(videoWithTags);  

      videoWithTags.sort(function(a, b) {
        a = a.video[0].v.properties.timeStamp;
        b = b.video[0].v.properties.timeStamp;
        return a>b ? -1 : a<b ? 1 : 0;
    });
      

          socket.emit('loadHomePageFromServer', {videoWithTags});   
    });

    socket.on('reloadAfterSave', function () {
     

    });
      
      // Quand le serveur reçoit un signal de type "messageUploadfromClient" du client    
      socket.on('messageUploadfromClient', function (message) {
          console.log('Un client me parle ! Il me dit : ' + message);

          crawler.crawl(message, function(url, title, tags){
              // crawler.crawl(url2, function(url){
              console.log(url);
              console.log(title);
              var html = crawler.addModalDiv(url, message);
              console.log(tags);
              socket.emit('messageUploadfromServer', {htmlfield: html, titlefield: title, originalUrlField: message, tags });                           
              });


      });

  


      socket.on('messageSavefromClient', function (message) {
        console.log('Un client me parle ! Il me dit : ' + message);
        console.log(message);

        var newVideo = {};
        newVideo.originalUrl = message.originalUrlField;
        newVideo.embedUrl = message.embedUrlField;
        newVideo.title = message.titlefield;
        newVideo.timestamp = new Date();


        video.create(newVideo, message.tags, function (err, video) {
						
          console.log(err);
          if (err)
          return next(err);
          console.log(video);

          socket.emit('videoSavedfromServer', {video, tagField: message.tags });                           
          

        });

    });
    
  });	


  }




