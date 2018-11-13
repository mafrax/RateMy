
var crawler = require('../models/crawl');
var pageLoader = require('../models/homePageLoader');
var video = require('../models/Video');
var tag = require('../models/Tag');
// var pass = require('../config/passport');
var neo4j = require("neo4j");
var index = require("../routes/index");
var db = new neo4j.GraphDatabase("http://neo4j:mafrax@5.39.80.142:7474");

var serverEvents = module.exports = function(io){
  io.sockets.on('connection', function (socket) {

    console.log('Un client est connecté !');
    console.log('Un client est connecté ! again');
    pageLoader.loadHomePage(function(videoWithTags){    
     
      if(videoWithTags!=null || videoWithTags != undefined || videoWithTags.length !=0 ){

        // videoWithTags.sort(function(a, b) {
        //   a = a.video[0].v.properties.timeStamp;
        //   b = b.video[0].v.properties.timeStamp;
        //   return a>b ? -1 : a<b ? 1 : 0;
        // });
        
        tag.getAll(function(_err, result2){          
          socket.emit('loadHomePageFromServer', {videos:videoWithTags, tags:result2});   
        });
        
      }
    });
    

    socket.on('reloadAfterSave', function () {
     

    });
      
      // Quand le serveur reçoit un signal de type "messageUploadfromClient" du client    
      socket.on('messageUploadfromClient', function (message) {
          console.log('Un client me parle ! Il me dit : ' + message);

          crawler.crawl(message, function(url, title, tags){
              // crawler.crawl(url2, function(url){
              if(url===null){
                var html = crawler.addModalDiv(url, message);
                socket.emit('messageUploadfromServer', {htmlfield: html, titlefield: title, originalUrlField: message, tags }); 
              } else {
                var html = crawler.addModalDiv(url, message);
                socket.emit('messageUploadfromServer', {htmlfield: html, titlefield: title, originalUrlField: message, tags });                           
              }
              });
      });


      socket.on('validateNoteFromClient', function (message) {
        console.log('Un client me parle ! Il me dit : ' + message);


        video.getCriterionWithRelAndTag(message.videoId, message.tagName, function(_err, result){

          var newtagName = message.tagName.toUpperCase();

          if(result.length===0){


            tag.getAll(function(err, results){

              var exists = []; 

              for(prop in results){
                if(results.hasOwnProperty(prop)){

                  if(results[prop].tag.properties.tagName.length>0){
                    var resultName = results[prop].tag.properties.tagName.toUpperCase();

                    if(resultName === newtagName){
                      exists.push(message.tagName);
                        video.createRelationShipWithTag(message.videoId, message.noteUser,results[prop].tag._id, function(err, result){

                          setTagLevel(message, result, socket);
                        })
                    }
                  }
                  
                }
              }

              if(exists.length===0){
                var data = {};
                data["tagName"] = message.tagName;
                tag.create(data, function(err, result){
                  video.createRelationShipWithTag(message.videoId, message.noteUser,result._id, function(err, result){
                    console.log(result);
                    setTagLevel(message, result, socket);
                  })
                })
              }

            })

          } else {
            setTagLevel(message, result[0], socket);
          }


          })

        })

        // crawler.crawl(message, function(url, title, tags){
        //     // crawler.crawl(url2, function(url){
        //     var html = crawler.addModalDiv(url, message);
        //     socket.emit('messageUploadfromServer', {htmlfield: html, titlefield: title, originalUrlField: message, tags });                           
        //     });


  


      socket.on('messageSavefromClient', function (message) {
        console.log('Un client me parle ! Il me dit messageSavefromClient: ' + message);

        var newVideo = {};
        newVideo.originalUrl = message.originalUrlField;
        newVideo.embedUrl = message.embedUrlField;
        newVideo.title = message.titlefield;
        newVideo.timestamp = new Date();


        video.create(newVideo, message.tags, function (err, video) {
						
          console.log(err);
          console.log(video);
          console.log("AFTER CREATE: "+video);
          if (err)
          return next(err);

          socket.emit('videoSavedfromServer', {video, tagField: message.tags });                           
          

        });

    });


    socket.on('searchValidatedFromClient', function (searchTags) {
      console.log('Un client me parle ! Il me dit : ' + searchTags);

      video.searchByCriterionLevel(searchTags, function (err, videos) {
 

        console.log(err);
        if (err)
        return next(err);


        console.log(videos);
        var vidIds = [];
        videos.sort(function(a, b) {
          a = a.v.properties.timeStamp;
          b = b.v.properties.timeStamp;
          return a>b ? -1 : a<b ? 1 : 0;
        });

        for(var prop in videos){
          if(videos.hasOwnProperty(prop)){
            vidIds.push(videos[prop].v._id);
          }
        }
        socket.emit('loadHomePageFromServer2', vidIds);    

        });

        

      });

    })

function setTagLevel(message, result, socket) {
  if (message.direction < 0) {
    video.resetRelationLevel(result.rel._id, result.rel.properties.previousLevel, result.rel.properties.votes, function (_err, result2) {
      console.log(result2);
      socket.emit('validatedNoteFromServer', { vId: message.videoId, tagId: message.tagNum, newLevel: result2.rel.properties.level });
    });
  }
  else {
    if (result.rel.properties.votes == null) {
      video.updateRelationLevel(result.rel._id, result.rel.properties.level, 0, message.noteUser, message.previousNote, function (_err, result2) {
        console.log(result2);
        socket.emit('validatedNoteFromServer', { vId: message.videoId, tagId: message.tagNum, newLevel: result2[0].rel.properties.level });
      });
    }
    else {
      video.updateRelationLevel(result.rel._id, result.rel.properties.level, result.rel.properties.votes, message.noteUser, message.previousNote, function (_err, result2) {
        console.log(result2);
        socket.emit('validatedNoteFromServer', { vId: message.videoId, tagId: message.tagNum, newLevel: result2[0].rel.properties.level });
      });
    }
  }
}

}