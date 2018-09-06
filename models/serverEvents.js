
var crawler = require('../models/crawl');
var pageLoader = require('../models/homePageLoader');
var video = require('../models/Video');
var pass = require('../config/passport');

var serverEvents = module.exports = function(io){
  io.sockets.on('connection', function (socket) {

    

    console.log('Un client est connecté !');
    
    pageLoader.loadHomePage(function(html, videoWithTags){         
          socket.emit('loadHomePageFromServer', {htmlfield: html, videoWithTags});   
    });

    socket.on('reloadAfterSave', function () {
      pageLoader.loadHomePage(function(html, videoWithTags){         
        socket.emit('loadHomePageFromServer', {htmlfield: html, videoWithTags});   
      });
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

          socket.emit('videoSavedfromServer');                           
          

        });

    });
    
    


  });

}


