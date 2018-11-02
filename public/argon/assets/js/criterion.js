//talkerscode.com/webtricks/add-edit-and-delete-rows-from-table-dynamically-using-javascript.php
http: console.log("tructruc");

// document.getElementById("myAnchor").addEventListener("click", function(event){
//     event.preventDefault()
// });

function initializeButoons() {
  var array = document.querySelectorAll('*[id^="cell"]');
  console.log(array);
  array.forEach(function(element) {
    var buttons = element.querySelectorAll('*[id^="save_button"]');
    console.log(buttons);
    buttons.forEach(function(button) {
      button.style.display = "none";
    });
  });
}

var hidden = document.getElementById("custId0");
console.log(hidden);

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
  console.log(videoNo);
  var max_div = document.getElementById("progressBarContainer" + videoNo);

  var numberOfVotes = 0;
  if(votes !== null){
    numberOfVotes = votes;
  }


  console.log(criterionTitle);
  // var new_name=document.getElementById("new_name").value;
  // console.log(n_sliders);
  var truc = max_div.querySelectorAll("div.progress-info");
  var new_numero = truc.length;
  var levelGlobal = 50 + level / 2;
  var html1 =
  '<div class=" progress-info flex-wrap">' +
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

  var html2 =
    '<div id="input-slider' +
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

  var html3 =
    '<div class=" progress-info flex-wrap">' +
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
    '" data-toggle="tooltip" data-placement="top" title="Average note on '+numberOfVotes+' votes in total">' +
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
    '<div class="validateCriterionContainer" '+
    '>'+
    '<button type="submit" class="validateCriterion"'+ 
    'data-toggle="tooltip" data-placement="top" title="clic here to validate and save your note and criterion"'+
    'id="validateCriterionButton'+videoNo +"_"+new_numero +'" onclick="validateSearchButton('+
    ''+videoNo +"," +new_numero +')'+
    '"></button>'+
    "</div>" +
    "</div>" +
    '<div class="progress flex-wrap"  >' +
    '<div class="progress-bar flex-wrap" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100" style="width: ' +
    levelGlobal +
    '%;background-image: linear-gradient(to top,rgb(255, 224, 237),rgb(252, 151, 218));"></div>' +   
    "</div>"    ;

  var new_element1 = document.createElement("div");
  new_element1.setAttribute("class", "progress-wrapper flex-wrap");
  new_element1.setAttribute("id", "wrapper" + videoNo + "_" + new_numero + "");
  // new_element.setAttribute('style', 'position: relative;');

  if (videoNo === 0) {
    console.log("1");
    new_element1.innerHTML = html1;
    max_div.appendChild(new_element1, document.getElementById("wrapper"+ videoNo + "_0"));
  } else {
    console.log("2");
    new_element1.innerHTML = html3;
    if(newOrFound){
      max_div.insertBefore(new_element1, document.getElementById("wrapper"+ videoNo + "_0"));
    } else {
      max_div.appendChild(new_element1);
    }
  }

  var new_element2 = document.createElement("div");
  new_element2.setAttribute("class", "input-slider-container flex-wrap");
  new_element2.setAttribute("id", "slider-container" + new_numero);


  new_element2.innerHTML = html2;

  if (videoNo === 0) {
    max_div.appendChild(new_element2);
  } else {
    if(newOrFound){
      max_div.insertBefore(new_element2, document.getElementById("wrapper"+ videoNo + "_0"));
    } else {
      max_div.appendChild(new_element2);
    }
  }
 

  var newSliderContainer = new_element1.querySelector(
    "#slider-container" + new_numero
  );
 

    $('[data-toggle="tooltip"]').tooltip();
   initializeSlider(new_element2, new_element1, new_numero, videoNo);

  // if (newOrFound === true) {
  //   document.getElementById(
  //     "save_button" + new_numero + "_" + videoNo
  //   ).style.display = "none";
  // }

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
  noUiSlider.create(slider, {
    start: [parseInt(startValue)],
    connect: [true, false],
    //step: 1000,
    range: {
      min: [parseInt(minValue)],
      max: [parseInt(maxValue)]
    }
  });

  slider.noUiSlider.on("update", function(a, b) {
    sliderValue.textContent = a[b];
    console.log(sliderValue);
    sliderPercent.innerHTML = sliderValue.innerHTML;
  });
}

function filterCriterion(event, videoNo) {
  var x = event.keyCode;
  console.log(x);
  console.log("criterion filtering");

  var collapsable = document.getElementById("demo" + videoNo);
  collapsable.setAttribute("class", "col-12 collapse show");
  console.log(collapsable);

  var container = document.getElementById("progressBarContainer" + videoNo);
  var videoCriterions = container.querySelectorAll(
    "*[id^=criterionName" + videoNo + "_]"
  );

  //not continued yet, its just a start to order criterions in alphabetical order inside the container
  var paraArr = [].slice.call(videoCriterions).sort(function (a, b) {
    return a.textContent > b.textContent ? 1 : -1;
});

  console.log(videoCriterions);
  const searchBar = document
    .getElementById("searchVideoBar" + videoNo);
  var value = searchBar
    .value.toUpperCase();
  var criterionContainersToKeep = [];

  if (value === "") {
    console.log("no value");
    var wrappers = container.querySelectorAll("*[id^=wrapper" + videoNo + "]");
    wrappers.forEach(function(element) {
      element.style.display = "";
    });
    var sliders = container.querySelectorAll("*[id^=slider-container]");
    sliders.forEach(function(element2) {
      element2.style.display = "";
    });

    document.getElementById(
      "filterAddCriterion_" + videoNo
    ).style.backgroundImage = "";

    document.getElementById(
      "filterAddCriterion_" + videoNo
    ).style.backgroundColor = "#5e72e4";

    console.log(document.getElementById(
      "filterAddCriterion_" + videoNo
    ));
  } else {
    var exist = [];

    if (videoCriterions.length === 0){
      console.log(exist);
            document.getElementById(
              "filterAddCriterion_" + videoNo
          ).setAttribute("class" , "validateCriterion2");
    } else {
      for (prop in videoCriterions) {
        if (videoCriterions.hasOwnProperty(prop)) {
          var name = videoCriterions[prop].innerHTML.toUpperCase();
          console.log(name);
          console.log(value);
          console.log(prop);
  
          if (name.startsWith(value)) {
            document.getElementById(
              "wrapper" + videoNo + "_" + prop
            ).style.display = "show";
            container.querySelector("#slider-container" + prop).style.display =
              "show";
            console.log("yep");
            if(name === value){
              exist.push(value);
            }
          } else {
            console.log("nop");
            document.getElementById(
              "wrapper" + videoNo + "_" + prop
            ).style.display = "none";
            container.querySelector("#slider-container" + prop).style.display =
              "none";
          }
  
          if (exist.length > 0) {
            console.log(exist);
            document.getElementById(
              "filterAddCriterion_" + videoNo
            ).style.backgroundImage = "linear-gradient(87deg, #f5365c 0, #f56036 100%)";
          } else {
            console.log(exist);
            document.getElementById(
              "filterAddCriterion_" + videoNo
            ).style.backgroundImage = "linear-gradient(87deg, #36f5ac 0, #11e67b 100%)";
          }
        }
      }
    }

    if (x === 13) {
      if(value.length>50){
        searchBar.style.color = "red";
        alert ("This Criterion is too long");
      } else {
        addVideoSearchCriterion(videoNo);
        document.getElementById(
          "filterAddCriterion_" + videoNo
        ).style.backgroundColor = "rgb(94, 114, 228)";

      }             

    }
  }
}

function displayOtherCriterions(videoNo, criterionNo) {
  var container = document.getElementById("progressBarContainer" + videoNo);
  var wrappers2 = container.querySelectorAll("*[id^=wrapper" + videoNo + "]");
  console.log(criterionNo);
  wrappers2.forEach(function (element) {
    console.log(element);
    element.style.display = "";
  });
  var sliders2 = container.querySelectorAll("*[id^=slider-container]");
  sliders2.forEach(function (element2) {
    var elementId = element2.id.substring(16, element2.id.length);
    var button2 =   document.getElementById("validateCriterionButton"+videoNo+"_"+elementId);
    // console.log(elementId);
    // console.log(element2);
    if(button2.className !== "validateCriterion2"){
      // console.log(button2.className);
      element2.style.display = "";
    }
  });
}


function addVideoSearchCriterion(videoNo){
  console.log(videoNo);
    var container = document.getElementById("progressBarContainer" + videoNo);
    var button = document.getElementById("filterAddCriterion_"+videoNo);
    console.log(button);
    if(button.style.backgroundColor === "green"){

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
    } else {
        alert ("This criterion is already present or is not Valid");
    }


}
