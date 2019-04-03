function timeConverter(UNIX_timestamp){
    var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
    d.setUTCMilliseconds(UNIX_timestamp);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = d.getFullYear();
    var month = months[d.getMonth()];
    var date = d.getDate();
    var hour = d.getHours();
    var min = d.getMinutes();
    var sec = d.getSeconds();
    var time = date + ' ' + month + ' ' + year ;
    return time;
  }
  
function  buildIframe(video) {


  
            var time =  timeConverter(video["video"].properties.timeStamp);

  
            var video2 = {};


            var thumbnail = "";
            var iframe = "";
            var responsiveDiv = "" ;


if (video["video"].properties.thumbnails == null ){

              responsiveDiv =   '<div class="embed-responsive embed-responsive-16by9">' +
              '<iframe class="embed-responsive-item" src="' +
              video["video"].properties.embedUrl +
              '" frameborder="0" allow="autoplay; encrypted-media"' +
              'allowfullscreen id="modalEmbedVideoId">' +
              '</iframe>'
              +
              '<input type="hidden" id="hiddenURl" value="' +
              video["video"].properties.originalUrl +
              '">' +
              '<button type="button" value="Edit" class="col-2 btn btn-sm btn-primary " style="border-radius: 100vh;right:-80%;" onclick="expandIframe(' +
              video["video"]._id +')" '+
              'data-toggle="tooltip" data-placement="top" title="Expand this video to a greater size" '+
              ' id="expandButton'+video["video"]._id+'"><span class="btn-inner--icon">' +
              '<i class="ni ni-tv-2"></i></button>' +
              "</span></button>" +
              "</div>" ;

} else {
  var nailsArray = video["video"].properties.thumbnails.split(',');

  var lastnum = nailsArray.length-1;
  thumbnail += '<div class="thumbnailsWrapper col-12" onmouseover="imageCarrousel(this,'+nailsArray.length+')" onmouseout="stopCarrousel(this)" id="thumbnailsWrapper'+video["video"]._id+'">';

  thumbnail += '<img class="vidThumb col-12 flex-wrap" src="'+nailsArray[nailsArray.length-1]+'" data-thumb_url="'+nailsArray[nailsArray.length-1]+'" id="thumbnail'+video["video"]._id+'_'+lastnum+'">';

  for(i=0; i<nailsArray[nailsArray.length-2]; i++){
    thumbnail += '<img class="vidThumb col-12" src="'+nailsArray[i]+'" data-thumb_url="'+nailsArray[i]+'" style="display:none" id="thumbnail'+video["video"]._id+'_'+i+'">';
  }

  thumbnail += '</div>';




  responsiveDiv =  '<div class="embed-responsive embed-responsive-16by9" style="display:none" id="responsiveDiv'+video["video"]._id+'">' +
  '<iframe class="embed-responsive-item" src="' +
  video["video"].properties.embedUrl +
  '" frameborder="0" allow="autoplay; encrypted-media"' +
  'allowfullscreen id="modalEmbedVideoId">' +
  '</iframe>'
  +
  '<input type="hidden" id="hiddenURl" value="' +
  video["video"].properties.originalUrl +
  '">' +
  '<button type="button" value="Edit" class="col-2 btn btn-sm btn-primary " style="border-radius: 100vh;right:-80%;" onclick="expandIframe(' +
  video["video"]._id +')" '+
  'data-toggle="tooltip" data-placement="top" title="Expand this video to a greater size" '+
  ' id="expandButton'+video["video"]._id+'"><span class="btn-inner--icon">' +
  '<i class="ni ni-tv-2"></i></button>' +
  "</span></button>" +
  "</div>" ;


}

var image = thumbnail ; 

var thmbnail2Vid;
if(video["video"].properties.thumbnails != null ){
  thmbnail2Vid = '<div class="titleText2" style="padding:0;">'+
  '<button id="thbnB'+video["video"]._id+'" class="btn btn-block bg-gradient-danger btn-primary" onclick="showVideo('+video["video"]._id+')" style="margin: auto; margin-bottom: 5px; text-align:center;";>'+ 
  '<i class="ni ni-button-play"></i>'+     
  '</button>'+
  '</div>' ;
} else {
  thmbnail2Vid = "";
}


            var vidCont = document.createElement("div");
            vidCont.setAttribute("class", "flex-wrap videoContainer");
            vidCont.setAttribute("style", "border: rgb(19, 161, 243); border-width: 2px; border-style: ridge; border-radius: 0.9vh;  margin-bottom:5px;");

            vidCont.innerHTML = '<div class="titleText">'+

            '<a href="#" class="hrefTitle">'+
            video["video"].properties.title +
            '</a>'+
            '</div>' +
            '<div class="titleText2">'+
            time+
            '</div>' +
            // '<div class="titleText2" id="totalVotes'+video["video"]._id+'">'+
            // '</div>' +

            thmbnail2Vid
            +         

            image
            +
            responsiveDiv
            +
              '<div class="flex-wrap">' +
  
              '<div class="input-group col-12" style="padding:0;">'+
              "</div>" ;


              var demo = document.createElement("div");
              demo.setAttribute("class", "collapse col-12");
              demo.setAttribute("id", "demo"+video["video"]._id);
              demo.setAttribute("style", "max-height: 50vh; overflow:auto;"); 


              var pbCont = document.createElement("div");
              pbCont.setAttribute("class", "container-fluid justify-content-center");
              pbCont.setAttribute("id", "progressBarContainer"+video["video"]._id);
              pbCont.setAttribute("style", "float: left;");

         
            if(video["tags"].length > 0 ){

              for(i=0; i < video["tags"].length; i++) {
               
                add_criterion_core(i,video["tags"][i].r.properties.level, video["video"]._id, video["tags"][i].t.properties.tagName, video["tags"][i].r.properties.votes, pbCont, false)

              }

            }

         

            demo.appendChild(pbCont);
            vidCont.appendChild(demo);

            video2["iframe"] = vidCont;
            video2["video"] = video;



            var newCriterionHtml =  '<input class="form-control" placeholder="Search" type="text" id="searchVideoBar' +
            video["video"]._id +'"'+
            'data-toggle="tooltip" data-placement="top" title="Here you can check whether this video is already rated with the given criterion. '+
            'If not then you can add it to the list"'+
            'onkeyUp="filterCriterion(event,' +
            video["video"]._id +
            ' )"'+
            '>' +
            '<span class="input-group-btn">' +
            '<button type="submit" class="btn btn-block btn-primary "' +            
            'id="filterAddCriterion_' +
            video["video"]._id +
            '" onclick=addVideoSearchCriterion('+video["video"]._id+')>' +
            "ADD" +
            "</button>" +
            "</span>" ;


            var newCriterionInput = document.createElement("div");
            newCriterionInput.setAttribute("class", "input-group");
            newCriterionInput.setAttribute("style", "position: sticky; bottom: 0; width: 100%;z-index:1000;");

            newCriterionInput.innerHTML = newCriterionHtml;

            demo.appendChild(newCriterionInput);


            var inputGroup = vidCont.querySelector(".input-group");
            
            var criteriontitle = vidCont.querySelector(".criterionTitle");

            var criterionnote = vidCont.querySelector(".progress-percentage");
            

            var newCriterionTitle = document.createElement("div");
            newCriterionTitle.setAttribute("class", "btn btn-1 btn-outline-warning");
            newCriterionTitle.setAttribute("style", "padding: .625rem .9rem;");
            newCriterionTitle.setAttribute("data-toggle", "collapse");
            newCriterionTitle.setAttribute("data-target", "#demo"+video["video"]._id+"");
            newCriterionTitle.setAttribute("aria-controls", "nav-inner-primary");
            newCriterionTitle.setAttribute("aria-expanded", "false");
            newCriterionTitle.setAttribute("aria-label", "Toggle navigation");
            newCriterionTitle.innerHTML = criteriontitle.innerHTML;

            var newCriterionnote = document.createElement("div");
            newCriterionnote.setAttribute("class", "btn btn-1 btn-outline-warning");
            newCriterionnote.setAttribute("style", "padding: .625rem .9rem;");
            newCriterionnote.setAttribute("data-toggle", "collapse");
            newCriterionnote.setAttribute("data-target", "#demo"+video["video"]._id+"");
            newCriterionnote.setAttribute("aria-controls", "nav-inner-primary");
            newCriterionnote.setAttribute("aria-expanded", "false");
            newCriterionnote.setAttribute("aria-label", "Toggle navigation");
            newCriterionnote.innerHTML = criterionnote.firstChild.innerHTML;

            var text = document.createElement("div");
            text.setAttribute("class", "btn btn-1 btn-outline-warning");
            text.setAttribute("style", "border:transparent; padding: .625rem .6rem;");
            text.setAttribute("data-toggle", "collapse");
            text.setAttribute("data-target", "#demo"+video["video"]._id+"");
            text.setAttribute("aria-controls", "nav-inner-primary");
            text.setAttribute("aria-expanded", "false");
            text.setAttribute("aria-label", "Toggle navigation");
            text.innerHTML = "Top Tag:";

            var expandButtonHtml =
            '<button class="btn btn-neutral" type="button" data-toggle="collapse" data-target="#demo' +
            video["video"]._id +
            '" aria-controls="nav-inner-primary"' +
            'aria-expanded="false" aria-label="Toggle navigation" >' +
            '<span class=""'+
            'data-toggle="tooltip" data-placement="top" title="Consult the list of criterii applying to this video" '+
            '>' +
            '<i class="ni ni-bold-down"></i></button>' +
            '</span>' +
            "</button>" ;

            var expandButton = document.createElement("span");
            expandButton.setAttribute("class", "input-group-btn");
            expandButton.setAttribute("style", "margin:auto; text-align: right; margin-right:0;");
            expandButton.innerHTML = expandButtonHtml;

            inputGroup.insertBefore(expandButton,inputGroup.firstChild);
            inputGroup.insertBefore(newCriterionnote,inputGroup.firstChild);
            inputGroup.insertBefore(newCriterionTitle,inputGroup.firstChild);
            inputGroup.insertBefore(text,inputGroup.firstChild);

            return video2;

  };

  function build36Frames(mainframe, cells, order) {
    h = 0;
    if(order){
      console.log(order);
      var lengthOfOrder;
      if(order.length>24){
        lengthOfOrder = 24
      } else {
        lengthOfOrder = order.length;
      }
      for (i=0; i<lengthOfOrder; i++){
        console.log(order[i]);
        var totalVotes;
        mainframe.appendChild(cells[order[i]]);
        console.log(cells[order[i]]);
        var demo = document.getElementById("demo" + order[i]);
        var slidercontainers = demo.querySelectorAll('*[id^="slider-container"]');
        for (k = 0; k < slidercontainers.length; k++) {
          var container = demo.querySelector("#slider-container" + k);
          var wrapper = demo.querySelector("#wrapper" + order[i] + "_" + k);
          initializeSlider(container, wrapper, k, order[i]);
        }
        for (var prop2 in globalObj["video_" + order[i]].tags) {
          if (globalObj["video_" + order[i]].tags.hasOwnProperty(prop2)) {
            if (globalObj["video_" + order[i]].tags[prop2].r.properties.votes != null ||
              globalObj["video_" + order[i]].tags[prop2].r.properties.votes !=
              undefined) {
              totalVotes =
                totalVotes +
                globalObj["video_" + order[i]].tags[prop2].r.properties.votes;
            }
          }
        }
        var totalVotesSquare = document.getElementById("totalVotes" + globalObj["video_" + order[i]].video._id);
        if (totalVotesSquare != null || totalVotesSquare != undefined) {
          totalVotesSquare.innerHTML = "Total: " + totalVotes + " vote(s)";
        }
        h++;
  
  
  
      }
  
  
    } else {
  
      for (var prop in cells) {
        if (cells.hasOwnProperty(prop) && h < 24 ) {
          if(!document.getElementById("cell"+prop)){
            console.log("HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH")
          
          console.log(prop);
          var totalVotes = 0;
  
          mainframe.appendChild(cells[prop]);
          console.log(cells[prop]);
          var demo = document.getElementById("demo" + prop);
          var slidercontainers = demo.querySelectorAll('*[id^="slider-container"]');
          for (k = 0; k < slidercontainers.length; k++) {
            var container = demo.querySelector("#slider-container" + k);
            var wrapper = demo.querySelector("#wrapper" + prop + "_" + k);
            initializeSlider(container, wrapper, k, prop);
          }
          for (var prop3 in globalObj["video_" + prop].tags) {
            if (globalObj["video_" + prop].tags.hasOwnProperty(prop3)) {
              if (globalObj["video_" + prop].tags[prop3].r.properties.votes != null ||
                globalObj["video_" + prop].tags[prop3].r.properties.votes !=
                undefined) {
                  console.log("votes: "+globalObj["video_" + prop].tags[prop3].r.properties.votes);
                totalVotes =
                  totalVotes +
                  globalObj["video_" + prop].tags[prop3].r.properties.votes;
                  console.log("truc: "+ totalVotes);
              }
            }
          }
          var totalVotesSquare2 = document.getElementById("totalVotes" + globalObj["video_" + prop].video._id);
          console.log("totalVotes: "+ totalVotes);
          if (totalVotesSquare2 != null || totalVotesSquare2 != undefined) {
            totalVotesSquare2.innerHTML = "Total: " + totalVotes + " vote(s)";
          }
          h++;
        }
        }
      }
    }
  }