var socket = io.connect("http://localhost:3000");

var globalVar = [];


// Sent on connection/searchValidatedFromClient by server
socket.on("loadHomePageFromServer", function(message) {

  // console.log(message.videoWithTags);

  fillLists(message);


  var mainframe = document.getElementById("mainFrame1");
  mainframe.innerHTML = "";

  // console.log("NEEEEEEEEEEEEW FUCKING VERSION");
// console.log(message);

    for (var prop in message.videos) {

      // console.log("in for loop"+ message);

      if (message.videos.hasOwnProperty(prop)) {

        // console.log("inside loading 1 :  "+message.videos[prop].video._id);
        var totalVotes = 0;
        var newDiv = document.createElement("div");
        newDiv.setAttribute("class", "col-4 flex-wrap");
        newDiv.setAttribute(
          "id",
          "cell" + message.videos[prop].video._id
        );

        var videoWithIframe = buildIframe(message.videos[prop]);
        // console.log("inside loading 2 :  "+videoWithIframe);
        newDiv.innerHTML = videoWithIframe["iframe"];
        mainframe.appendChild(newDiv);
        globalVar.push(videoWithIframe);

        for (var prop2 in message.videos[prop].tags) {
          if (message.videos[prop].tags.hasOwnProperty(prop2)) {


            // console.log(message.videos[prop].video._id);
            // console.log(message.videos[prop].tags[prop2].t.properties.tagName);

            add_criterion(
              message.videos[prop].video._id,
              false,
              message.videos[prop].tags[prop2].t.properties.tagName,
              message.videos[prop].tags[prop2].r.properties.level,
              message.videos[prop].tags[prop2].r.properties.votes
            );


            if (
              message.videos[prop].tags[prop2].r.properties.votes !=
                null ||
                message.videos[prop].tags[prop2].r.properties.votes !=
                undefined
            ) {
              totalVotes =
                totalVotes +
                message.videos[prop].tags[prop2].r.properties.votes;
            }


          }
        }


        var totalVotesSquare = document.getElementById(
          "totalVotes" + message.videos[prop].video._id
        );
        if (totalVotesSquare != null || totalVotesSquare != undefined) {
          totalVotesSquare.innerHTML = "Total: " + totalVotes + " vote(s)";
        }

      }
    }

    initializeButoons();
    // console.log(FRUITS_AND_VEGGIES2);
    fillOrderList();
    // console.log(globalVar);
    // console.log("globalVar");
    if (ALL_VID.length === 0) {
      initializeAllvids();
    }

});

socket.on("loadHomePageFromServer2", function(listofFoundIds) {


  // console.log(listofFoundIds);

  var mainframe = document.getElementById("mainFrame1");
  mainframe.innerHTML = "";
  // console.log(globalVar);
  for(var prop in globalVar){
    if(globalVar.hasOwnProperty(prop)){
        if(listofFoundIds.includes(globalVar[prop].video["video"]._id)){
          var newDiv = document.createElement("div");
          newDiv.setAttribute("class", "col-4 flex-wrap");
          newDiv.setAttribute(
            "id",
            "cell" + globalVar[prop].video["video"]._id
          );
          newDiv.innerHTML = globalVar[prop].iframe;
          mainframe.appendChild(newDiv);

          for (var prop2 in globalVar[prop].video.tags){
            if(globalVar[prop].video.tags.hasOwnProperty(prop2)){
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
    }
  }

  initializeButoons();
  // console.log(FRUITS_AND_VEGGIES2);
  fillOrderList();

});

socket.on("messageUploadfromServer", function(message) {
  // console.log(message.originalUrlField);
  $("#modal-body").html(message.htmlfield);
  $("#modal-defaultLabel").html(message.titlefield);
  initializeButoons();
  // console.log(message);
  // console.log(message.tags);
  for (var key in message.tags) {
    // console.log(key);
    if (message.tags.hasOwnProperty(key)) {
      add_criterion(0, false, message.tags[key], 0);
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



socket.on("videoSavedfromServer", function() {
  // console.log("reload page");
  $("#closeModalButton").trigger("click");
  window.location.replace("/");
});

$("#validateSearchButton").click(function() {
  // console.log(ALL_VID);
  var searchcriterions = $("div[id*='searchCriterion']");
  if (searchcriterions.length === 0) {
    window.location.replace("/");
  } else {
    // console.log(searchcriterions);
    var criterions = document.querySelectorAll('*[id^="searchCriterion"]');
    // console.log(criterions);
    var tagName = [];
    criterions.forEach(function(element) {
      var tag = {};

      tag["name"] = element.querySelectorAll("span")[0].innerHTML.trim();
      tag["lowerValue"] = parseInt(
        element.querySelectorAll('*[id^="criterionLowRange"]')[0].innerHTML
      );
      tag["higherValue"] = parseInt(
        element.querySelectorAll('*[id^="criterionHighRange"]')[0].innerHTML
      );
      tagName.push(tag);
    });
    // console.log(tagName);
    fillOrderList();
    
    socket.emit("searchValidatedFromClient", tagName);
  }
  return false; // Permet de bloquer l'envoi "classique" du formulaire . En fait, return false est équivalent à la fonction de jQuery preventDefault()
});

function fillLists(message) {
  tagNames = [];
  // console.log(message.tags);
  for (var prop in message.tags) {
    if (message.tags.hasOwnProperty(prop)) {
      tagNames.push(message.tags[prop].tag.properties.tagName);
    }
  }
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


function modalSaveButtonClick(){
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

  socket.emit("messageSavefromClient", {
    titlefield: title,
    originalUrlField: originalUrl,
    embedUrlField: embedUrl,
    tags
  });

  return false; // Permet de bloquer l'envoi "classique" du formulaire . En fait, return false est équivalent à la fonction de jQuery preventDefault()
};

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
