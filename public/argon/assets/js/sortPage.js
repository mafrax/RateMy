ALL_VID = [];

function initializeAllvids() {
  var cells = document.querySelectorAll('*[id^="cell"]');

  // for (i = 0; i < cells.length; i++) {
  //   ALL_VID.push(cells[i]);
  // }
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

  // console.log(searchCriterions);

  if (searchCriterions.length > 0) {
    // console.log("lenthg >0");
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
    // console.log(selectList);

  } else {
    // console.log(FRUITS_AND_VEGGIES2);
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
    var ordercriterion = $(this).val();
  var mainFrame = document.getElementById("mainFrame1");
  var cells = document.querySelectorAll('*[id^="cell"]');
  var hidden = document.querySelectorAll("[style='display:none']");
  var cellNotFound = [];
  // console.log(cells);
  // console.log(hidden);
  // console.log("hello there");
  var foundtaginCell = [];
  // console.log(ALL_VID);
  // console.log(ordercriterion);


  if (ordercriterion == "----" || ordercriterion == "") {
    // console.log("NONONONE");
    mainFrame.innerHTML = "";
    // console.log(ALL_VID);
    for (i = 0; i < 36; i++) {
        mainFrame.appendChild(ALL_VID[i]);
      }
      var inputBars = mainFrame.querySelectorAll('*[id^="searchVideoBar"]');
      var collapseButtons = mainFrame.querySelectorAll('*[id^="collapseVideoButton"]');
      for (i = 0; i < inputBars.length; i++) {
        inputBars[i].value = ordercriterion;
        var event = new Event('keyup');
        inputBars[i].dispatchEvent(event);
      }
      $('.collapse').collapse("hide");
      

  } else {
    
    for(var props in globalObj){
      if(globalObj.hasOwnProperty(props)){
        var vidNo = globalObj[props].video._id;
        var cellTags =  globalObj[props].tags;

        var boolFound = false;

        for (j = 0; j < cellTags.length; j++) {
          console.log(cellTags[j].t.labels[0]);
          if (cellTags[j].t.properties.tagName === ordercriterion) {
         
            var map = {};


            var newDiv = document.createElement("div");
            newDiv.setAttribute("class", "col-4 flex-wrap");
            newDiv.setAttribute(
          "id",
          "cell" + vidNo
          );
          
          var videoWithIframe = buildIframe(globalObj[props]);
        // console.log("inside loading 2 :  "+videoWithIframe);
        newDiv.innerHTML = videoWithIframe["iframe"];

console.log(videoWithIframe);
            map["cell"] = newDiv;

            var tagNote = cellTags[j].r.properties.level

            map["tagValue"] = tagNote;

            console.log(map);
            foundtaginCell.push(map);

          }
        }

      }
    }


    // for (i = 0; i < cells.length; i++) {
    //   var vidNo = cells[i].id.substring(4, cells[i].id.length);
    //   var cellTags = cells[i].querySelectorAll('*[id^="criterionName"]');
    //   // console.log(vidNo);
    //   var boolFound = false;

    //   for (j = 0; j < cellTags.length; j++) {
    //     if (cellTags[j].innerHTML === ordercriterion) {
    //       var map = {};
    //       map["cell"] = cells[i];
    //       // console.log("cellNo:" + j + " vidNo:" + vidNo);
    //       var tagNote = cells[i].querySelector("#globalNote" + j + "_" + vidNo)
    //         .innerHTML;
    //       // console.log(tagNote);
    //       map["tagValue"] = tagNote;
          
    //       // console.log("hello there i found a tag");
    //       foundtaginCell.push(map);
    //       // cells[i].style.display = "show";
    //       cells[i].setAttribute("style", 'style="display:show;"');
    //       boolFound = true;
    //     }
    //     if (!boolFound) {
    //       // cells[i].style.display = "none";
    //       cells[i].setAttribute("style", 'style="display:none;"');
    //     }
    //   }
    // }
console.log(foundtaginCell);

    foundtaginCell.sort(function(a, b) {
      a = parseFloat(a.tagValue);
      b = parseFloat(b.tagValue);
      return a > b ? -1 : a < b ? 1 : 0;
    });
  
    var mainFrame = document.getElementById("mainFrame1");
    mainFrame.innerHTML = "";
    for (i = 0; i < foundtaginCell.length; ++i) {
      var vidNo2 = foundtaginCell[i].cell.id.substring(4, foundtaginCell[i].cell.id.length);
      mainFrame.appendChild(foundtaginCell[i].cell);
      var inputBar = foundtaginCell[i].cell.querySelector("#searchVideoBar"+vidNo2);
      inputBar.value = ordercriterion;
      var event = new Event('keyup');
      inputBar.dispatchEvent(event);
    }

    // var criterions = document.querySelectorAll('*[id^="searchCriterion"]');
    // var tagName = [];
    
    // var tag = {};
    
    // tag["name"] = ordercriterion;
    // tag["lowerValue"] = -100;
    // tag["higherValue"] = 100;
    // tagName.push(tag);
    // console.log(tagName);
    
    // socket.emit("searchValidatedFromClient", tagName);

  }

 

  // console.log(foundtaginCell);
});
