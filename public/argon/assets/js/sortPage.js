ALL_VID = [];

function initializeAllvids() {
  var cells = document.querySelectorAll('*[id^="cell"]');

  for (i = 0; i < cells.length; i++) {
    ALL_VID.push(cells[i]);
  }
}

function fillOrderList() {
  var selectList = document.getElementById("myDatalist");

  var searchList = document.getElementById("searchCell");
  var searchCriterions = searchList.querySelectorAll(
    '*[id^="spanCriterionName"]'
  );

  console.log(searchCriterions);

  if (searchCriterions.length > 0) {
    console.log("lenthg >0");
    for (var props in searchCriterions) {
      if (searchCriterions.hasOwnProperty(props)) {
        var text = searchCriterions[props].innerHTML;
        var new_element = document.createElement("option");
        new_element.setAttribute("id", "orderListCriterion" + props);
        new_element.innerHTML = text;
        selectList.innerHTML = "<option selected>None</option><option>date</option><option>Number of votes</option>";
        selectList.appendChild(new_element);
      }
    }
    console.log(selectList);

  } else {
    console.log(FRUITS_AND_VEGGIES2);

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
  
    var ordercriterion = $(this).val();
  var mainFrame = document.getElementById("mainFrame1");
  var cells = document.querySelectorAll('*[id^="cell"]');
  var hidden = document.querySelectorAll("[style='display:none']");
  var cellNotFound = [];
  console.log(cells);
  console.log(hidden);
  console.log("hello there");
  var foundtaginCell = [];
  console.log(ALL_VID);
  console.log(ordercriterion);
  if (ordercriterion == "----" || ordercriterion == "") {
    console.log("NONONONE");
    mainFrame.innerHTML = "";
    for (i = 0; i < ALL_VID.length; i++) {
        mainFrame.appendChild(ALL_VID[i]);
      }

  } else {
    for (i = 0; i < cells.length; i++) {
      var vidNo = cells[i].id.substring(4, cells[i].id.length);
      var cellTags = cells[i].querySelectorAll('*[id^="criterionName"]');
      console.log(vidNo);
      var boolFound = false;

      for (j = 0; j < cellTags.length; j++) {
        if (cellTags[j].innerHTML === ordercriterion) {
          var map = {};
          map["cell"] = cells[i];
          console.log("cellNo:" + j + " vidNo:" + vidNo);
          var tagNote = cells[i].querySelector("#globalNote" + j + "_" + vidNo)
            .innerHTML;
          console.log(tagNote);
          map["tagValue"] = tagNote;
          console.log("hello there i found a tag");
          foundtaginCell.push(map);
          // cells[i].style.display = "show";
          cells[i].setAttribute("style", 'style="display:show;"');
          boolFound = true;
        }
        if (!boolFound) {
          // cells[i].style.display = "none";
          cells[i].setAttribute("style", 'style="display:none;"');
        }
      }
    }
    console.log(foundtaginCell);

    foundtaginCell.sort(function(a, b) {
      a = parseFloat(a.tagValue);
      b = parseFloat(b.tagValue);
      return a > b ? -1 : a < b ? 1 : 0;
    });
  
    var mainFrame = document.getElementById("mainFrame1");
    mainFrame.innerHTML = "";
    for (i = 0; i < foundtaginCell.length; ++i) {
      mainFrame.appendChild(foundtaginCell[i].cell);
    }
  }

 

  console.log(foundtaginCell);
});
