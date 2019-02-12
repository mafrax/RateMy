ALL_VID = [];
var currentSearch = {};
var order = [];
var ordercriterion;

function initializeAllvids() {

  for(var props in globalVar){
    if(globalVar.hasOwnProperty(props)){
console.log(globalVar[props].video.video)
      var new_element = document.createElement("div");
        new_element.setAttribute("class", "col-12 col-md-4 flex-wrap");
        new_element.setAttribute("id", "cell" + globalVar[props].video.video._id);
        new_element.innerHTML = globalVar[props].iframe;

      ALL_VID.push(new_element);
    }
  }
}

function fillOrderList() {
  var selectList = document.getElementById("myDatalist");

  var searchList = document.getElementById("searchCell");
  var searchCriterions = searchList.querySelectorAll(
    '*[id^="criterionName"]'
  );


  if (searchCriterions.length > 0) {
    for (var props in searchCriterions) {
      if (searchCriterions.hasOwnProperty(props)) {
        var text = searchCriterions[props].innerHTML;
        var new_element = document.createElement("option");
        new_element.setAttribute("id", "orderListCriterion" + props);
        new_element.innerHTML = text;
        selectList.innerHTML = "<option selected>----</option><option>date</option><option>Number of votes</option>";
        selectList.appendChild(new_element);
      }
    }


  } else {

    selectList.innerHTML = "<option selected>----</option><option>date</option><option>Number of votes</option>";
    
    for (i=0; i<tagNames.length; i++){
      var text = tagNames[i];
      var new_element = document.createElement("option");
      new_element.setAttribute("id", "orderListCriterion" + i);
      new_element.innerHTML = text;
      selectList.appendChild(new_element);
 
    }

  }
}

$("#monselect").change(function() {
  console.log(globalObj);
  ordercriterion = $(this).val();
  sortPage(ordercriterion);

});

function sortPage(ordercriterion) {
  var mainFrame = document.getElementById("mainFrame1");
  var foundtaginCell = [];
  if (ordercriterion == "----" || ordercriterion == "") {
    currentSearch = {};
    order = [];
    mainFrame.innerHTML = "";
    if (Object.getOwnPropertyNames(currentSearch).length > 0) {
      build36Frames(mainFrame, currentSearch, globalOrder);
    }
    else {
      build36Frames(mainFrame, globalCells, globalOrder);
    }
    sortBool = false;
    var event = closeModal(mainFrame);
  }
  else {
    sortBool = true;
    console.log("SORTBOOL 1"+  sortBool);
    console.log("searchBOOL 1"+  searchBool);
    var locaVar = {};
    if (!searchBool) {
      console.log("FAAAAAAAAAALSE")
      currentSearch = {};
      locaVar = globalObj;
    } else {
      for(var props in currentSearch){
        if(currentSearch.hasOwnProperty(props)){
          locaVar["video_"+props] = globalObj["video_"+props];
        }
      }

    }
    console.log(locaVar);
    for (var props in locaVar) {
      if (locaVar.hasOwnProperty(props)) {
        var cellTags = locaVar[props].tags;

        for (j = 0; j < cellTags.length; j++) {

          if (cellTags[j].t.properties.tagName.toUpperCase() === ordercriterion.toUpperCase()) {
            var map = {};
            map["cell"] = globalCells[locaVar[props].video._id];

            currentSearch[locaVar[props].video._id] = globalCells[locaVar[props].video._id];
            var tagNote = cellTags[j].r.properties.level;
            map["tagValue"] = tagNote;

            foundtaginCell.push(map);
          }
        }
      }
    }

    foundtaginCell.sort(function (a, b) {
      a = parseFloat(a.tagValue);
      b = parseFloat(b.tagValue);
      return a > b ? -1 : a < b ? 1 : 0;
    });
    console.log(currentSearch);
    order = [];
    for (i = 0; i < foundtaginCell.length; i++) {
      var vidNo2 = foundtaginCell[i].cell.id.substring(4, foundtaginCell[i].cell.id.length);
      order.push(vidNo2);
    }
    var mainFrame = document.getElementById("mainFrame1");
    mainFrame.innerHTML = "";
    console.log(foundtaginCell);
    console.log(currentSearch);
    build36Frames(mainFrame, currentSearch, order);
    var demo = document.querySelectorAll('*[id^="cell"]');
    for (i = 0; i < demo.length; ++i) {
      var vidNo2 = demo[i].getAttribute("id").substring(4, demo[i].getAttribute("id").length);
      console.log(vidNo2);
      var inputBar = demo[i].querySelector("#searchVideoBar" + vidNo2);
      console.log(inputBar);
      inputBar.value = ordercriterion;
      console.log(inputBar.value);
      var event2 = new Event('keyup');
      inputBar.dispatchEvent(event2);
    }
  }
}

function closeModal(mainFrame) {
  console.log("closeModal -------------------")
  var inputBars = mainFrame.querySelectorAll('*[id^="searchVideoBar"]');
  for (i = 0; i < inputBars.length; i++) {
    if(inputBars[i].value != ""){
      inputBars[i].value = ordercriterion;
      var event = new Event('keyup');
      inputBars[i].dispatchEvent(event);
    }
  }
  $('.collapse').collapse("hide");
  return event;
}
