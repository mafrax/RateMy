var socket = io.connect("http://localhost:3000");

socket.on("messageUploadfromServer", function(message) {
  console.log(message.originalUrlField);
  $("#modal-body").html(message.htmlfield);
  $("#exampleModalLabel").html(message.titlefield);
  console.log(message);
  console.log(message.tags);
  for (key in message.tags) {
    console.log(key);
    if (message.tags.hasOwnProperty(key)) {
      add_criterion(0,false, message.tags[key],0);
    }
  }
});


socket.on('validatedNoteFromServer', function (message) {
  console.log("wtf");
  console.log(message);
  var globalNote = document.getElementById("globalNote"+message.tagId+'_'+message.vId);
  console.log(globalNote);
  globalNote.innerHTML= message.newLevel;
  displayOtherCriterions(message.vId, message.tagId);
  // document.getElementById('criterionName'+message.vId).scrollIntoView(true);
  $('#demo'+message.vId+'').scrollTop($('#demo'+message.vId+'')[0].scrollHeight);
})

socket.on("loadHomePageFromServer", function(message) {
  console.log(message);
  console.log(message.videoWithTags);

  var mainframe = document.getElementById("mainFrame1");
  mainframe.innerHTML = "";
  if(message.videoWithTags == null){
    mainframe.innerHTML = "NO VIDEO FOUND THAT COULD SATISFY YOU, we are very sorry";
  } else {
    var arrayLength = message.videoWithTags.length;
    for (var i = 0; i < arrayLength; i++) {
      console.log(message.videoWithTags[i]);
      console.log(message.videoWithTags[i]['video']);
      console.log(message.videoWithTags[i]["video"][0].v._id);
      var newDiv = document.createElement("div");
      newDiv.setAttribute("class", "col-4 flex-wrap");
      newDiv.setAttribute(
        "id",
        "cell" + message.videoWithTags[i]["video"][0].v._id
        );
        
    newDiv.innerHTML = message.videoWithTags[i]["iframe"];
    mainframe.appendChild(newDiv);
    
    console.log(message.videoWithTags[i]["video"]);
    for (var prop in message.videoWithTags[i]["video"]) {
      if (message.videoWithTags.hasOwnProperty(prop)) {
        console.log(message.videoWithTags[i]["video"][prop].t.properties.tagName);
        console.log(message.videoWithTags[i]["video"][prop].v._id);
        console.log(message.videoWithTags[i]["video"][prop].r.properties.level);
        add_criterion(
          message.videoWithTags[i]["video"][prop].v._id,false,
          message.videoWithTags[i]["video"][prop].t.properties.tagName,
          message.videoWithTags[i]["video"][prop].r.properties.level
        );

      }
    }
    
    // initializeCustomCombobox1(message.videoWithTags[i]["video"][0].v._id);
  }
  initializeButoons();
  }
});

socket.on("searchResults", function(message) {

  tagNames = [];
  console.log(message);
  for (var prop in message) {
    if (message.hasOwnProperty(prop)) {
      tagNames.push(message[prop].tag.properties.tagName);
    }
  }
  updateVeggies(tagNames);
  initializeCombobox1(0);
  // initializeCombobox3(0);
  lists = document.querySelectorAll('*[id^="ex1-"]');
  console.log(lists);
//   for (var prop in lists) {
//     if (lists.hasOwnProperty(prop)) {
//       id = lists[prop].id.toString();
//         console.log(id);       
//         no = id.substring(9, id.length);  
//         console.log(no);

//     }
// }
});

socket.on("videoSavedfromServer", function() {
  $("#closeModalButton").trigger("click");
  window.location.replace("/");
});

$("#validateSearchButton").click(function() {
  
  

    
var searchcriterions = $("div[id*='searchCriterion']");
if(searchcriterions.length === 0){
  window.location.replace("/");
} else {

console.log(searchcriterions);
var criterions = document.querySelectorAll('*[id^="searchCriterion"]');
console.log(criterions);
var tagName = [];
criterions.forEach(function(element){
  var tag = {};
  // console.log(element.querySelectorAll('span')[0]);
  // var span = element.querySelectorAll('*[id^="criterionLowRange"]');
  // console.log(span);
  // console.log(span[0].innerHTML);
  tag["name"] = element.querySelectorAll('span')[0].innerHTML.trim();
  tag["lowerValue"] = parseInt(element.querySelectorAll('*[id^="criterionLowRange"]')[0].innerHTML);
  tag["higherValue"] = parseInt(element.querySelectorAll('*[id^="criterionHighRange"]')[0].innerHTML);
  tagName.push(tag);
})
console.log(tagName);
socket.emit("searchValidatedFromClient", tagName);

}
return false; // Permet de bloquer l'envoi "classique" du formulaire . En fait, return false est équivalent à la fonction de jQuery preventDefault()


});

$("#uploadForm").submit(function() {
  var url1 = $("#field2").val();

  console.log( $('#poke'));

  if(url1 === ""){
    console.log("fils depute :" + url1);   
  } else {
    $('#poke').modal('toggle');
    socket.emit("messageUploadfromClient", url1);
  }

  return false; // Permet de bloquer l'envoi "classique" du formulaire . En fait, return false est équivalent à la fonction de jQuery preventDefault()
});

$('#uploadTooltip').mouseleave(function(){
  console.log("focusout");
  $(this).tooltip('hide')
  .attr('data-original-title', "Here you can upload a link to a page that contains an actual porn video (we will search for the first iframe in that page) from any website")

});



$("#field2").on("input", function() {
  console.log("YIPYIOP");
  console.log(this.value);

  if(this.value.includes("https:") && this.value.includes("www.")){
    $('#uploadTooltip').tooltip('hide')
    .attr('data-original-title', "Here you can upload a link to a page that contains an actual porn video (we will search for the first iframe in that page) from any website")
    $('#poke').removeAttr("disabled");
  
  } else {
    $('#uploadTooltip').tooltip('hide')
          .attr('data-original-title', "Please enter a valid url")
          .tooltip('show');
    $('#poke').attr("disabled", "disabled");
  }

});

// $("[id^=searchVideoBar]").on("", function() {
//   console.log(this.value); 
//   filterCriterion(this.value)
//   return false; // Permet de bloquer l'envoi "classique" du formulaire . En fait, return false est équivalent à la fonction de jQuery preventDefault()
// });

$("#modalSaveButton").click(function() {
  var title = $("#exampleModalLabel").html();
  var originalUrl = $("#hiddenURl").val();
  var embedUrl = $("#modalEmbedVideoId").attr("src");
  console.log(title);
  console.log(originalUrl);
  console.log(embedUrl);

  var criterionTitlesNumber = $("#exampleModal span.criterionTitle").length;

  var tags = {};

  for (i = 0; i < criterionTitlesNumber; i++) {
    console.log(i);

    console.log($("#criterionName" + i + "_0"));

    var tag = {};
    tag["tagName"] = $("#criterionName" + i + "_0").html();
    tag["tagValue"] = $("#criterionNote" + i+ "_0").html();
    tags["tag" + i] = tag;
  }

  socket.emit("messageSavefromClient", {
    titlefield: title,
    originalUrlField: originalUrl,
    embedUrlField: embedUrl,
    tags
  });

  return false; // Permet de bloquer l'envoi "classique" du formulaire . En fait, return false est équivalent à la fonction de jQuery preventDefault()

});


function validateSearchButton(videoNo, criterionno){

console.log(videoNo);
console.log(criterionno);
var container = document.getElementById("progressBarContainer" + videoNo);
var slider = container.querySelector("#slider-container"+criterionno);
var name = container.querySelector("#criterionName"+videoNo+"_"+criterionno);
var handler = slider.querySelector(".noUi-handle");
var note = container.querySelector("#criterionNote"+criterionno+"_"+videoNo);
var globalNote = container.querySelector("#globalNote"+criterionno+"_"+videoNo);
var button = document.getElementById("validateCriterionButton"+videoNo+"_"+criterionno);


$(button).tooltip('hide')
          .attr('data-original-title', "By clicking here again you can revert your previous note")
          .tooltip('show');


console.log(button.style.backgroundColor);

var inOut;

if(button.style.backgroundColor !== "green"){
  console.log("green");
  button.style.backgroundColor = "green";
  console.log(slider);
  console.log(handler);
  slider.style.display = 'none';
  note.style.color = "green";
  inOut=1;
console.log(name);
socket.emit("validateNoteFromClient", {
  tagName: name.innerHTML,
  noteUser: note.innerHTML,
  videoId : videoNo,
  previousNote : globalNote.innerHTML,
  tagNum : criterionno,
  direction : inOut
  });
  

} else {
  console.log("red");
  button.style.backgroundColor = "#1fa2ff";
  slider.style.display = 'initial';
  note.style.color = "rgba(94, 114, 228)";
  inOut=-1;

  $(button).tooltip('hide')
  .attr('data-original-title', "clic here to validate and save your note and criterion");


  socket.emit("validateNoteFromClient", {
    tagName: name.innerHTML,
    // noteUser: globalNote.innerHTML,
    videoId : videoNo,
    tagNum : criterionno,
    direction : inOut
    });

}



}


// '<span style="color:rgba(248, 9, 176, 0.575)" id="globalNote' +
//     new_numero +
//     "_" +
//     videoNo +
//     '">' +
//     level +
//     "</span>