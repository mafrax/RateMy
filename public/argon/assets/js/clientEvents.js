var socket = io.connect("http://5.39.80.142:3000");

var globalVar = [];
var globalOrder = [];
var globalObj = {};
var globalCells = {};
var localTable = [];
var tagMachin = {};
var searchBool = false;
var sortBool = false;

// Sent on connection/searchValidatedFromClient by server
socket.on("loadHomePageFromServer", function(message) {
  // console.log(message.videoWithTags);

  fillLists(message);

  var mainframe = document.getElementById("mainFrame1");
  mainframe.innerHTML = "";

  // console.log("NEEEEEEEEEEEEW FUCKING VERSION");
  console.log(message);
  
  console.time("dbsave");
  for (var prop in message.videos) {
    if (message.videos.hasOwnProperty(prop)) {
      // console.log("inside loading 1 :  "+message.videos[prop].video._id);

      console.log(prop);
      var totalVotes = 0;
      var newDiv = document.createElement("div");
      newDiv.setAttribute("class", "col-4 flex-wrap");
      newDiv.setAttribute("id", "cell" + message.videos[prop].video._id);

      var videoWithIframe = buildIframe(message.videos[prop]);
      // console.log("inside loading 2 :  "+videoWithIframe);

      var tagMachin2 = {};
      for (j = 0; j < message.videos[prop].tags.length; j++) {
        tagMachin2[message.videos[prop].tags[j].t.properties.tagName.toUpperCase()] = message.videos[prop].tags[j].r.properties.level;
        tagMachin[message.videos[prop].video._id] = tagMachin2;
      }

      newDiv.innerHTML = videoWithIframe["iframe"].outerHTML;
      globalVar.push(videoWithIframe);
      globalCells[message.videos[prop].video._id] = newDiv;
      localTable.push(globalCells[message.videos[prop].video._id]);
    }
  }
  console.timeEnd("dbsave");

  globalVar.sort(function(a, b) {
    a = a.video.video.properties.timeStamp;
    b = b.video.video.properties.timeStamp;
    return a>b ? -1 : a<b ? 1 : 0;
  });

  for (i=0; i < globalVar.length ; i++){
      globalOrder.push(globalVar[i].video.video._id)
  }

  build36Frames(mainframe, globalCells, globalOrder);

  initializeButoons();
  fillOrderList();

  $('[data-toggle="tooltip"]').tooltip();
  
  if (ALL_VID.length === 0) {
    initializeAllvids();
  }
});

socket.on("loadHomePageFromServer2", function(listofFoundIds) {
  console.log("loadHomePageFromServer2");

  var mainframe = document.getElementById("mainFrame1");
  mainframe.innerHTML = "";
  // console.log(globalVar);
  i = 0;
  for (var prop in globalVar) {
    if (globalVar.hasOwnProperty(prop)) {
      if (listofFoundIds.includes(globalVar[prop].video["video"]._id)) {
        var newDiv = document.createElement("div");
        newDiv.setAttribute("class", "col-4 flex-wrap");
        newDiv.setAttribute("id", "cell" + globalVar[prop].video["video"]._id);
        newDiv.innerHTML = globalVar[prop].iframe;
        if (i < 36) {
          mainframe.appendChild(newDiv);

          for (var prop2 in globalVar[prop].video.tags) {
            if (globalVar[prop].video.tags.hasOwnProperty(prop2)) {
              add_criterion(
                globalVar[prop].video["video"]._id,
                false,
                globalVar[prop].video.tags[prop2].t.properties.tagName,
                globalVar[prop].video.tags[prop2].r.properties.level,
                globalVar[prop].video.tags[prop2].r.properties.votes
              );
            }
          }
        }
        i++;
      }
    }
  }

  initializeButoons();
  fillOrderList();
  initializeUI() ;
});

socket.on("messageUploadfromServer", function(message) {
  // console.log(message.originalUrlField);
  $("#modal-body").html(message.htmlfield);
  $("#modal-defaultLabel").html(message.titlefield);
  initializeButoons();
  var demo = document.getElementById("demo" + 0);
  // console.log(message);
  // console.log(message.tags);
  for (var key in message.tags) {
    // console.log(key);
    if (message.tags.hasOwnProperty(key)) {
      add_criterion(0, false, message.tags[key], 0);
      var container = demo.querySelector("#slider-container" + key);
      var wrapper = demo.querySelector("#wrapper" + 0 + "_" + key);
      initializeSlider(container, wrapper, key, 0);
    }
  }
});

socket.on("validatedNoteFromServer", function(message) {
  // console.log("wtf");
  // console.log(message);
  var globalNote = document.getElementById(
    "globalNote" + message.tagId + "_" + message.vId
  );
  // console.log(globalNote);
  globalNote.innerHTML = message.newLevel;
  displayOtherCriterions(message.vId, message.tagId);
});

socket.on("videoSavedfromServer", function(message) {
  console.log(message);
  console.log(message.video);
  console.log(message.tagField);
      var totalVotes = 0;
      var newDiv = document.createElement("div");
      newDiv.setAttribute("class", "col-4 flex-wrap");
      newDiv.setAttribute("id", "cell" + message.video._id);


      var newVid = {};
      var vidTags = [];
      newVid["video"] = message.video;
      

   
      // console.log("inside loading 2 :  "+videoWithIframe);

      var tagMachin2 = {};

      for (var prop in message.tagField){
        if(message.tagField.hasOwnProperty(prop)){
          var tag = {};
          var t = {};
          var propt = {};
          propt["tagName"] =message.tagField[prop].tagName.toUpperCase();
          t["properties"] = propt;
          tag["t"] = t;
          
          var r = {};
          var propR = {};
          propR["level"] = message.tagField[prop].tagValue;
          propR["votes"] = 1;
          r["properties"] = propR;
          tag["r"] = r;

          tagMachin2[message.tagField[prop].tagName.toUpperCase()] = message.tagField[prop].tagValue;
          tagMachin[message.video._id] = tagMachin2;

          vidTags.push(tag);
        }
      }
      console.log(vidTags);
      newVid["tags"] = vidTags ;
      var videoWithIframe = buildIframe(newVid);
      newDiv.innerHTML = videoWithIframe["iframe"].outerHTML;
      globalVar.push(videoWithIframe);
      globalCells[newVid] = newDiv;
      localTable.push(globalCells[newVid]);
      var mainframe = document.getElementById("mainFrame1");
      mainframe.insertBefore(newDiv, mainframe.firstChild);
});

$("#validateSearchButton").click(function() {
  // console.log(ALL_VID);
  var searchcriterions = $("div[id*='searchCriterion']");
  if (searchcriterions.length === 0) {
    searchBool = false;
    window.location.replace("/");
  } else {
    searchBool = true;
    // console.log(searchcriterions);
    var criterions = document.querySelectorAll('*[id^="searchCriterion"]');
    // console.log(criterions);
    var tagName = {};  
    var tag = {};
    criterions.forEach(function(element) {
      var taglevels = [];
      taglevels.push(parseInt(element.querySelectorAll('*[id^="criterionLowRange"]')[0].innerHTML));
      taglevels.push(parseInt(element.querySelectorAll('*[id^="criterionHighRange"]')[0].innerHTML));
      tag[element.querySelectorAll("span")[0].innerHTML.trim().toUpperCase()] = taglevels;
    });
    // console.log(tagName);
    fillOrderList();



    var foundtaginCell = [];
    if(!sortBool){
      currentSearch = {};
    }
console.log(tag);
console.log(Object.getOwnPropertyNames(tag))

        var firstFilter = [];
        var match = [];
        for (props2 in tagMachin){
          if(tagMachin.hasOwnProperty(props2)){
            var tags = Object.getOwnPropertyNames(tag);
            var tagsMachin = Object.getOwnPropertyNames(tagMachin[props2]);

            var tagsfound = [];
            for (i=0; i<tags.length; i++){
              if(Object.getOwnPropertyNames(tagMachin[props2]).includes(tags[i]) ){
                console.log(tag[tags[i]][0]);
                console.log(tagMachin[props2][tags[i]]);
                if(tagMachin[props2][tags[i]]<= tag[tags[i]][1] && tagMachin[props2][tags[i]]>= tag[tags[i]][0]){
                  console.log("lol");
                  tagsfound.push(tags[i]);
                }
              }
            }
            if(tagsfound.length === tags.length){
              console.log("lolilol");
              match.push(props2);
              currentSearch[props2] = globalCells[props2];

            }

          }
        }


    
if(!sortBool){
  var mainFrame = document.getElementById("mainFrame1");
  mainFrame.innerHTML = "";
  if(match.length>0){
    console.log(foundtaginCell);
    console.log(currentSearch);
    build36Frames(mainFrame, currentSearch);

  } else {
    var container = document.getElementById("searchCellContainer");
    var height = container.clientHeight +100;
    console.log(height);
    var new_element = document.createElement("h1");
    new_element.innerHTML = "We are very sorry but we couldn't find any video that match your search" ;
    var new_element2 = document.createElement("div");
    new_element2.appendChild(new_element);
    new_element2.setAttribute("style", "height:"+height+"px;");
    console.log(new_element2.clientHeight);
    console.log(new_element2);
    mainFrame.appendChild(new_element2);
  }
} else {
  sortPage(ordercriterion);
}

    // socket.emit("searchValidatedFromClient", tagName);
  }
  return false; // Permet de bloquer l'envoi "classique" du formulaire . En fait, return false est équivalent à la fonction de jQuery preventDefault()
});

function build36Frames(mainframe, cells, order) {
  h = 0;
  if(order){
    console.log(order);
    var lengthOfOrder;
    if(order.length>6){
      lengthOfOrder = 6
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
      if (cells.hasOwnProperty(prop) && h < 6 ) {
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
        for (var prop2 in globalObj["video_" + prop].tags) {
          if (globalObj["video_" + prop].tags.hasOwnProperty(prop2)) {
            if (globalObj["video_" + prop].tags[prop2].r.properties.votes != null ||
              globalObj["video_" + prop].tags[prop2].r.properties.votes !=
              undefined) {
                console.log("votes: "+globalObj["video_" + prop].tags[prop2].r.properties.votes);
              totalVotes =
                totalVotes +
                globalObj["video_" + prop].tags[prop2].r.properties.votes;
                console.log("truc: "+ totalVotes);
            }
          }
        }
        var totalVotesSquare = document.getElementById("totalVotes" + globalObj["video_" + prop].video._id);
        console.log("totalVotes: "+ totalVotes);
        if (totalVotesSquare != null || totalVotesSquare != undefined) {
          totalVotesSquare.innerHTML = "Total: " + totalVotes + " vote(s)";
        }
        h++;
      }
      }
    }
  }
}

function fillLists(message) {
  tagNames = [];
  // console.log(message.tags);
  for (var prop in message.tags) {
    if (
      message.tags.hasOwnProperty(prop) &&
      !tagNames.includes(message.tags[prop].tag.properties.tagName.toUpperCase())
    ) {
      tagNames.push(message.tags[prop].tag.properties.tagName.toUpperCase());
    }
  }

  globalObj = message.videos;

  console.log(globalObj);

  tagNames.sort(function (a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
});

  // console.log(tagNames);
  updateVeggies(tagNames);
  // console.log(FRUITS_AND_VEGGIES2);
  initializeCombobox1(0);
  // console.log(FRUITS_AND_VEGGIES2);
  // initializeCombobox3(0);
  lists = document.querySelectorAll('*[id^="ex1-"]');
  // console.log(lists);
}

function launchCrawl() {
  var url1 = $("#field2").val();

  // console.log($("#poke"));

  if (url1 === "") {
    // console.log("fils depute :" + url1);
  } else {
    // $('#poke').modal('toggle');
    socket.emit("messageUploadfromClient", url1);
  }

  return false; // Permet de bloquer l'envoi "classique" du formulaire . En fait, return false est équivalent à la fonction de jQuery preventDefault()
}

$("#uploadTooltip").mouseleave(function() {
  // console.log("focusout");
  $(this)
    .tooltip("hide")
    .attr(
      "data-original-title",
      "Here you can upload a link to a page that contains an actual porn video (we will search for the first iframe in that page) from any website"
    );
});

$("#field2").on("input", function() {
  // console.log("YIPYIOP");
  // console.log(this.value);

  if (this.value.includes("https:")) {
    if (this.value.includes("katestube")) {
      $("#uploadTooltip")
        .tooltip("hide")
        .attr("data-original-title", "Katestube is not supported, sorry")
        .tooltip("show");
      $("#poke").attr("disabled", "disabled");
    } else {
      $("#uploadTooltip")
        .tooltip("hide")
        .attr(
          "data-original-title",
          "Here you can upload a link to a page that contains an actual porn video (we will search for the first iframe in that page) from any website"
        );
      $("#poke").removeAttr("disabled");
    }
  } else {
    $("#uploadTooltip")
      .tooltip("hide")
      .attr("data-original-title", "Please enter a valid url")
      .tooltip("show");
    $("#poke").attr("disabled", "disabled");
  }
});

// $("[id^=searchVideoBar]").on("", function() {
//   // console.log(this.value);
//   filterCriterion(this.value)
//   return false; // Permet de bloquer l'envoi "classique" du formulaire . En fait, return false est équivalent à la fonction de jQuery preventDefault()
// });

function modalSaveButtonClick() {
  var title = $("#modal-defaultLabel").html();
  var originalUrl = $("#hiddenURl").val();
  var embedUrl = $("#modalEmbedVideoId").attr("src");
  // console.log(title);
  // console.log(originalUrl);
  // console.log(embedUrl);

  var criterionTitlesNumber = $("#modal-default span.criterionTitle").length;

  var tags = {};

  for (i = 0; i < criterionTitlesNumber; i++) {
    // console.log(i);

    // console.log($("#criterionName" + i + "_0"));

    var tag = {};
    tag["tagName"] = $("#criterionName0_" + i).html();
    tag["tagValue"] = $("#criterionNote" + i + "_0").html();
    tags["tag" + i] = tag;
  }
  // console.log(tags);
  $("#closeModalButton").trigger("click");
  socket.emit("messageSavefromClient", {
    titlefield: title,
    originalUrlField: originalUrl,
    embedUrlField: embedUrl,
    tags
  });

  return false; // Permet de bloquer l'envoi "classique" du formulaire . En fait, return false est équivalent à la fonction de jQuery preventDefault()
}

function validateSearchButton(videoNo, criterionno) {
  // console.log(videoNo);
  // console.log(criterionno);
  var container = document.getElementById("progressBarContainer" + videoNo);
  var slider = container.querySelector("#slider-container" + criterionno);
  var name = container.querySelector(
    "#criterionName" + videoNo + "_" + criterionno
  );
  var handler = slider.querySelector(".noUi-handle");
  var note = container.querySelector(
    "#criterionNote" + criterionno + "_" + videoNo
  );
  var globalNote = container.querySelector(
    "#globalNote" + criterionno + "_" + videoNo
  );
  var button = document.getElementById(
    "validateCriterionButton" + videoNo + "_" + criterionno
  );

  $(button)
    .tooltip("hide")
    .attr(
      "data-original-title",
      "By clicking here again you can revert your previous note"
    )
    .tooltip("show");

  // console.log(button.style.backgroundColor);

  var inOut;

  if (button.className !== "validateCriterion2") {
    // console.log(button.className);
    button.setAttribute("class", "validateCriterion2");
    // console.log(slider);
    // console.log(handler);
    slider.style.display = "none";
    inOut = 1;
    // console.log(name);
    socket.emit("validateNoteFromClient", {
      tagName: name.innerHTML,
      noteUser: note.innerHTML,
      videoId: videoNo,
      previousNote: globalNote.innerHTML,
      tagNum: criterionno,
      direction: inOut
    });
  } else {
    // console.log(button.className);
    button.setAttribute("class", "validateCriterion");
    // console.log(slider);
    slider.style.display = "initial";
    inOut = -1;

    $(button)
      .tooltip("hide")
      .attr(
        "data-original-title",
        "clic here to validate and save your note and criterion"
      );

    socket.emit("validateNoteFromClient", {
      tagName: name.innerHTML,
      videoId: videoNo,
      tagNum: criterionno,
      direction: inOut
    });
  }
}


function loadMore() {
  var mainframe = document.getElementById("mainFrame1");

  if(Object.getOwnPropertyNames(currentSearch).length>0){
    console.log(Object.getOwnPropertyNames(currentSearch))
    if(order.length>0){

      console.log("1");

      var demo = document.querySelectorAll('*[id^="cell"]');
      var numberOfCellsDisplayed = demo.length;

      var videostoAdd = order.slice(numberOfCellsDisplayed, numberOfCellsDisplayed+6);

      build36Frames(mainframe, currentSearch, videostoAdd);

      var demo2 = document.querySelectorAll('*[id^="cell"]');

      for (i = numberOfCellsDisplayed; i < numberOfCellsDisplayed+6; ++i) {
  
        console.log("JJJJJJJJJJJJJJJJJJJJJ")

        var vidNo2 = demo2[i].getAttribute("id").substring(4, demo2[i].getAttribute("id").length);
        console.log(vidNo2)
        var inputBar = demo2[i].querySelector("#searchVideoBar"+vidNo2);
        console.log(inputBar);
        inputBar.value = ordercriterion;
        console.log(inputBar.value);
        var event = new Event('keyup');
        inputBar.dispatchEvent(event);
  
      }

    } else {
      console.log("2");
      build36Frames(mainframe, currentSearch, globalOrder);
      
    }
  } else {
    console.log("3");
    var demo = document.querySelectorAll('*[id^="cell"]');
    var numberOfCellsDisplayed = demo.length;

    var videostoAdd = globalOrder.slice(numberOfCellsDisplayed, numberOfCellsDisplayed+6);

    build36Frames(mainframe, globalCells, videostoAdd);
    var event = closeModal(mainframe);
  }


}
