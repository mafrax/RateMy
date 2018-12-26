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
  
function   buildIframe(video) {


  
            var time =  timeConverter(video["video"].properties.timeStamp);

  
            var video2 = {};


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
            '<div class="titleText2" id="totalVotes'+video["video"]._id+'">'+
            '</div>' +
            // '</div>'+
            '<div class="embed-responsive embed-responsive-16by9">' +
              '<iframe class="embed-responsive-item" src="' +
              video["video"].properties.embedUrl +
              '" frameborder="0" allow="autoplay; encrypted-media"' +
              'allowfullscreen id="modalEmbedVideoId">' +
              "</iframe>" +
              '<input type="hidden" id="hiddenURl" value="' +
              video["video"].properties.originalUrl +
              '">' +
              '<button type="button" value="Edit" class="col-2 btn btn-sm btn-primary " style="border-radius: 100vh;right:-80%;" onclick="expandIframe(' +
              video["video"]._id +')" '+
              'data-toggle="tooltip" data-placement="top" title="Expand this video to a greater size" '+
              ' id="expandButton'+video["video"]._id+'"><span class="btn-inner--icon">' +
              '<i class="ni ni-tv-2"></i></button>' +
              "</span></button>" +
              "</div>" +
  
              
              '<div class="flex-wrap">' +
  
              '<div class="input-group">'+
              '<input class="form-control" placeholder="Search" type="text" id="searchVideoBar' +
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
              "</span>" +
              '<span class="input-group-btn">' +
              '<button class="btn btn-neutral" type="button" data-toggle="collapse" data-target="#demo' +
              video["video"]._id +
              '" aria-controls="nav-inner-primary"' +
              'aria-expanded="false" aria-label="Toggle navigation" >' +
              '<span class="navbar-toggler-icon"><span class="btn-inner--icon"'+
              'data-toggle="tooltip" data-placement="top" title="Consult the list of criterii applying to this video" '+
              '>' +
              '<i class="ni ni-bold-down"></i></button>' +
              "</span></span>" +
              "</button>" +
              "</span>" +
              "</div>" ;

              var demo = document.createElement("div");
              demo.setAttribute("class", "collapse col-12");
              demo.setAttribute("id", "demo"+video["video"]._id);
              demo.setAttribute("style", "max-height: 50vh; overflow:auto;"); 


              var pbCont = document.createElement("div");
              pbCont.setAttribute("class", "container-fluid justify-content-center");
              pbCont.setAttribute("id", "progressBarContainer"+video["video"]._id);
              pbCont.setAttribute("style", "float: left;");

              
              console.log(video["tags"]);
              console.log(video["tags"].length);
            if(video["tags"].length > 0 ){

              for(i=0; i < video["tags"].length; i++) {
                console.log(video["tags"][i].r.properties.level);
                add_criterion_core(i,video["tags"][i].r.properties.level, video["video"]._id, video["tags"][i].t.properties.tagName, video["tags"][i].r.properties.votes, pbCont, false)
              }

            }
            demo.appendChild(pbCont);
            vidCont.appendChild(demo);

                
            video2["iframe"] = vidCont;
            video2["video"] = video;


            return video2;

  };