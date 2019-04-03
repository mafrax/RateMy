function initializeButoons() {
  var array = document.querySelectorAll('*[id^="cell"]');
  array.forEach(function(element) {
    var buttons = element.querySelectorAll('*[id^="save_button"]');
    buttons.forEach(function(button) {
      button.style.display = "none";
    });
  });
}

var hidden = document.getElementById("custId0");

function edit_row(no, videoNo) {
  document.getElementById("edit_button" + no + "_" + videoNo).style.display =
    "none";
  document.getElementById("save_button" + no + "_" + videoNo).style.display =
    "inline-block";

  var demo = document.getElementById("progressBarContainer" + videoNo);

  var name = demo.querySelector("#criterionName" + no + "_" + videoNo);
  var name_data = name.innerHTML;
  name.innerHTML =
    "<input type='text' id='name_text" +
    no +
    "_" +
    videoNo +
    "' value='" +
    name_data +
    "'>";
}

function save_row(no, videoNo) {
  var name_val = document.getElementById("name_text" + no + "_" + videoNo)
    .value;
  var hidden_field = document.getElementById("custId" + no);

  hidden_field.setAttribute("value", name_val);
  document.getElementById(
    "criterionName" + no + "_" + videoNo
  ).innerHTML = name_val;
  document.getElementById("edit_button" + no + "_" + videoNo).style.display =
    "inline-block";
  document.getElementById("save_button" + no + "_" + videoNo).style.display =
    "none";
}

function add_criterion(videoNo, newOrFound, criterionTitle, level, votes) {
  var max_div = document.getElementById("progressBarContainer" + videoNo);
  // console.log(max_div);
  var numberOfVotes = 0;
  if(votes !== null){
    numberOfVotes = votes;
  }
  var truc = max_div.querySelectorAll("div.progress-info");
  var new_numero = add_criterion_core(truc.length, level, videoNo, criterionTitle, numberOfVotes, max_div, newOrFound);


  return new_numero;

}

function add_criterion_core(length, level, videoNo, criterionTitle, numberOfVotes, max_div, newOrFound) {

  var new_numero = length;
  
  var criterionContainer = document.createElement("div");
  criterionContainer.setAttribute("id", "criterionContainer" + videoNo + "_" + new_numero + "");

  var levelGlobal = 50 + level / 2;
  var html1 = '<div class=" progress-info flex-wrap">' +
    '<div class="progress-label flex-wrap">' +
    '<span class="criterionTitle" id="criterionName' +
    videoNo +
    "_" +
    new_numero +
    '">' +
    criterionTitle +
    "</span>" +
    '<input type="hidden" id="custId' +
    new_numero +
    '">' +
    "</div>" +
    '<div class="progress-percentage flex-wrap" style="padding-right: 4px; padding-left: 4px;float: right;" >' +
    '<span style="color: rgba(94, 114, 228)" id="criterionNote' +
    new_numero +
    "_" +
    videoNo +
    '">0.00</span>' +
    "</div>" +
    "</div>";
  var html2 = '<div id="input-slider' +
    new_numero +
    '" class="input-slider flex-wrap"  data-range-value-min="-100" data-range-value-max="100"></div>' +
    "<!-- Input slider values -->" +
    '<div class="row mt-3 d-none flex-wrap">' +
    '<div class="col-6">' +
    '<span id="input-slider-value' +
    new_numero +
    '" class="range-slider-value flex-wrap" data-range-value-low="0"></span>' +
    "</div>" +
    "</div>";
  var html3 = '<div class=" progress-info flex-wrap">' +
    '<div class="progress-label3 flex-wrap">' +
    '<span class="criterionTitle" id="criterionName' +
    videoNo +
    "_" +
    new_numero +
    '">' +
    criterionTitle +
    "</span>" +
    '<input type="hidden" id="custId' +
    new_numero +
    '">' +
    "</div>" +
    '<div class="progress-label2 flex-wrap">' +
    '<div class="progress-percentage" >' +
    '<span style="color:rgba(248, 9, 176, 0.575)" id="globalNote' +
    new_numero +
    "_" +
    videoNo +
    '" data-toggle="tooltip" data-placement="top" title="Average note on ' + numberOfVotes + ' votes in total">' +
    level +
    "</span>" +
    "</div>" +
    "</div>" +
    // style="padding-right: 4px; padding-left: 4px;" 
    // flex-wrap
    '<div class="progress-percentage2 " >' +
    '<span style="color: rgba(94, 114, 228)" id="criterionNote' +
    new_numero +
    "_" +
    videoNo +
    '">0.00</span>' +
    "</div>" +
    // flex-wrap 
    '<div class="validateCriterionContainer" ' +
    '>' +
    '<button type="submit" class="validateCriterion"' +
    'data-toggle="tooltip" data-placement="top" title="clic here to validate and save your note and criterion"' +
    'id="validateCriterionButton' + videoNo + "_" + new_numero + '" onclick="validateSearchButton(' +
    '' + videoNo + "," + new_numero + ')' +
    '"></button>' +
    "</div>" +
    "</div>" +
    '<div class="progress flex-wrap"  >' +
    '<div class="progress-bar flex-wrap" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100" style="width: ' +
    levelGlobal +
    '%;background-image: linear-gradient(to top,rgb(255, 224, 237),rgb(252, 151, 218));"></div>' +
    "</div>";
  var new_element1 = document.createElement("div");
  new_element1.setAttribute("class", "progress-wrapper flex-wrap");
  new_element1.setAttribute("id", "wrapper" + videoNo + "_" + new_numero + "");
  // new_element.setAttribute('style', 'position: relative;');
  if (videoNo === 0) {
    new_element1.innerHTML = html1;
    criterionContainer.appendChild(new_element1, document.getElementById("wrapper" + videoNo + "_0"));

  }
  else {
    new_element1.innerHTML = html3;
    if (newOrFound) {
      criterionContainer.insertBefore(new_element1, document.getElementById("wrapper" + videoNo + "_0"));

    }
    else {
      criterionContainer.appendChild(new_element1);

    }
  }
  var new_element2 = document.createElement("div");
  new_element2.setAttribute("class", "input-slider-container flex-wrap");
  new_element2.setAttribute("id", "slider-container" + new_numero);
  new_element2.innerHTML = html2;
  if (videoNo === 0) {
    criterionContainer.appendChild(new_element2);
  }
  else {
    if (newOrFound) {
      criterionContainer.insertBefore(new_element2, document.getElementById("wrapper" + videoNo + "_0"));
    }
    else {
      criterionContainer.appendChild(new_element2);
    }
  }


  var globalNotes = max_div.querySelectorAll('span[id^="globalNote"]'); 
  var prev ={} ;
  var inserted = 0;
  prev["id"] = 0;
var pos= 0 ;
// console.log(globalNotes);

if(globalNotes.length === 0){
  // console.log("First " + level)
  max_div.appendChild(criterionContainer);

} else {
  
  for (var prop in globalNotes) {
    if (globalNotes.hasOwnProperty(prop)) {

      // console.log(globalNotes[prop]);

      var note = parseInt(globalNotes[prop].innerHTML);

      if(globalNotes[prop]){


        var curId = globalNotes[prop].id.substring(globalNotes[prop].id.indexOf("Note")+4, globalNotes[prop].id.indexOf("_"));
        var prevCont = max_div.querySelector("#criterionContainer"+videoNo+"_"+prev["id"]+"");

        if(note>level){
          prev["note"] = note;
          prev["id"] = curId;          


            var beforeElement = max_div.querySelector("#criterionContainer"+videoNo+"_"+prev["id"]+"");

            max_div.insertBefore(criterionContainer, beforeElement.nextSibling);
            inserted = 1;
        } else {
          pos++;
        }
        if(pos === globalNotes.length && inserted!=1){
          max_div.insertBefore(criterionContainer,max_div.firstChild);
        }

      } 
    }
  }

}
  $('[data-toggle="tooltip"]').tooltip();

  return new_numero;
}

function initializeSlider(sliderContainer, new_element, new_numero, videoNo) {
  var slider = sliderContainer.querySelector("#input-slider" + new_numero);

  var sliderPercent = new_element.querySelector(
    "#criterionNote" + new_numero + "_" + videoNo
  );

  var maxValue = slider.getAttribute("data-range-value-max");
  var minValue = slider.getAttribute("data-range-value-min");
  var sliderValue = sliderContainer.querySelector(
    "#input-slider-value" + new_numero
  );
 
  var startValue = sliderValue.getAttribute("data-range-value-low");
  if ( !slider.noUiSlider ) {
  noUiSlider.create(slider, {
    start: [parseInt(startValue)],
    connect: [true, false],
    //step: 1000,
    range: {
      min: [parseInt(minValue)],
      max: [parseInt(maxValue)]
    }
  });
  }
  slider.noUiSlider.on("update", function(a, b) {
    sliderValue.textContent = a[b];
    sliderPercent.innerHTML = sliderValue.innerHTML;
  });
  
}


function filterCriterion(event, videoNo) {
  var x = event.keyCode;
// console.log(videoNo);
  var collapsable = document.getElementById("demo" + videoNo);
  
  var container = document.getElementById("progressBarContainer" + videoNo);
  var videoCriterions = container.querySelectorAll(
    "*[id^=criterionName" + videoNo + "_]"
  );

  //not continued yet, its just a start to order criterions in alphabetical order inside the container
  var paraArr = [].slice.call(videoCriterions).sort(function (a, b) {
    return a.textContent > b.textContent ? 1 : -1;
});

  const searchBar = document
    .getElementById("searchVideoBar" + videoNo);
  var value = searchBar
    .value.toUpperCase();
  var criterionContainersToKeep = [];

  if (value === "") {
    var wrappers = container.querySelectorAll("*[id^=criterionContainer" + videoNo + "]");
    wrappers.forEach(function(element) {
      element.style.display = "";
    });

    document.getElementById(
      "filterAddCriterion_" + videoNo
    ).style.backgroundImage = "";

    document.getElementById(
      "filterAddCriterion_" + videoNo
    ).style.backgroundColor = "#5e72e4";

  } else {
    var exist = [];

    if (videoCriterions.length === 0){
          document.getElementById(
            "filterAddCriterion_" + videoNo
          ).style.backgroundImage = "linear-gradient(87deg, rgb(54, 245, 172) 0px, rgb(17, 230, 123) 100%)";
    } else {
      for (prop in videoCriterions) {
        if (videoCriterions.hasOwnProperty(prop)) {
          var name = videoCriterions[prop].innerHTML.toUpperCase();

          var critID = videoCriterions[prop].id.substring(videoCriterions[prop].id.indexOf("_")+1,videoCriterions[prop].id.length);
  
          if (name.startsWith(value)) {

            document.getElementById(
              "criterionContainer" + videoNo + "_" + critID
            ).style.display = "show";
            
            if(name === value){
              exist.push(value);
            }
          } else {

            document.getElementById(
              "criterionContainer" + videoNo + "_" + critID
            ).style.display = "none";
            
          }
          if (exist.length > 0 || value.length>50 || value.includes("http") || value.includes("\/") || value.includes(":") || value.includes(".") || value.includes("#")) {
            document.getElementById(
              "filterAddCriterion_" + videoNo
            ).style.backgroundImage = "linear-gradient(87deg, #f5365c 0, #f56036 100%)";
          } else {
            document.getElementById(
              "filterAddCriterion_" + videoNo
            ).style.backgroundImage = "linear-gradient(87deg, #36f5ac 0, #11e67b 100%)";
          }
        }
      }
    }

    if (x === 13) {
      if(value.length>50 || value.includes("http") || value.includes("\/") || value.includes(":") || value.includes(".") || value.includes("#")){
        searchBar.style.color = "red";
        alert ("This Criterion is too long");
      } else {
        addVideoSearchCriterion(videoNo);

      }             

    }
  }
}

function displayOtherCriterions(videoNo, criterionNo) {
  var container = document.getElementById("progressBarContainer" + videoNo);
  var wrappers2 = container.querySelectorAll("*[id^=wrapper" + videoNo + "]");
  wrappers2.forEach(function (element) {
    element.style.display = "";
  });
  var sliders2 = container.querySelectorAll("*[id^=slider-container]");
  sliders2.forEach(function (element2) {
    var elementId = element2.id.substring(16, element2.id.length);
    var button2 =   document.getElementById("validateCriterionButton"+videoNo+"_"+elementId);

    if(button2.className !== "validateCriterion2"){
      element2.style.display = "";
    }
  });
}


function addVideoSearchCriterion(videoNo){
    var container = document.getElementById("progressBarContainer" + videoNo);
    var button = document.getElementById("filterAddCriterion_"+videoNo);
    if(button.style.backgroundImage === "linear-gradient(87deg, rgb(54, 245, 172) 0px, rgb(17, 230, 123) 100%)"){

    var value = document.getElementById("searchVideoBar"+videoNo).value;
      var bool = false;
    if(videoNo === 0){
      bool=true;
    }
    var criterionno = add_criterion(videoNo, bool, value, 0,1);
      
      document
    .getElementById("searchVideoBar" + videoNo).value = "";

    var button2 = document.getElementById("validateCriterionButton"+videoNo+"_"+criterionno);

    $(button2).tooltip('hide')
      .attr('data-original-title', "Please validate the new criterion and its note by clicking here")
      .tooltip('show');
      button.style.backgroundImage = "";
      button.style.backgroundColor = "rgb(94, 114, 228)";

    } else {
        alert ("This criterion is already present or is not Valid");
    }
    // console.log(criterionno);
      var demo = document.getElementById("demo" + videoNo);
      var container = demo.querySelector("#slider-container" + criterionno);
      var wrapper = demo.querySelector("#wrapper" + videoNo + "_" + criterionno);
      // console.log(container);
      // console.log(wrapper);
      initializeSlider(container, wrapper, criterionno, videoNo);


}
