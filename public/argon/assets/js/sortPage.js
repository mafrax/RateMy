ALL_VID = [];
var currentSearch = {};
var order = [];
var ordercriterion;

function initializeAllvids() {

  for(var props in globalVar){
    if(globalVar.hasOwnProperty(props)){
console.log(globalVar[props].video.video)
      var new_element = document.createElement("div");
        new_element.setAttribute("class", "col-4 flex-wrap");
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
    var i = 0;
    FRUITS_AND_VEGGIES2.forEach(function(element) {
      var new_element = document.createElement("option");
      new_element.setAttribute("id", "orderListCriterion" + i);
      new_element.innerHTML = element;
      selectList.appendChild(new_element);
      i++;
    });
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
    sort = false;
    var event = closeModal(mainFrame);
  }
  else {
    sort = true;
    var locaVar = {};
    if (!search) {
      currentSearch = {};
      locaVar = globalObj;
    } else {
      for(var props in currentSearch){
        if(currentSearch.hasOwnProperty(props)){
          locaVar["video_"+props] = globalObj["video_"+props];
        }
      }

    }
    for (var props in locaVar) {
      if (locaVar.hasOwnProperty(props)) {
        var cellTags = locaVar[props].tags;
        for (j = 0; j < cellTags.length; j++) {
          console.log(cellTags[j].t.labels[0]);
          if (cellTags[j].t.properties.tagName === ordercriterion) {
            var map = {};
            map["cell"] = globalCells[locaVar[props].video._id];
            console.log(globalCells[locaVar[props].video._id]);
            currentSearch[locaVar[props].video._id] = globalCells[locaVar[props].video._id];
            var tagNote = cellTags[j].r.properties.level;
            map["tagValue"] = tagNote;
            console.log(map);
            foundtaginCell.push(map);
          }
        }
      }
    }
    console.log(foundtaginCell);
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
      var inputBar = demo[i].querySelector("#searchVideoBar" + vidNo2);
      inputBar.value = ordercriterion;
      var event = new Event('keyup');
      inputBar.dispatchEvent(event);
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
