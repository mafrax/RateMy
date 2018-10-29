function fillOrderList(){

   var selectList = document.getElementById("monselect");

   var searchList = document.getElementById("searchCell");
    var searchCriterions = searchList.querySelectorAll('*[id^="spanCriterionName"]');
    if(searchCriterions.length>0){
        for (var props in searchCriterions){
            if(searchCriterions.hasOwnProperty(props)){
                var text = searchCriterions[props].innerHTML;
                var new_element = document.createElement("option");
                new_element.setAttribute('id', "orderListCriterion"+props);
                new_element.innerHTML = text;

                selectList.appendChild(new_element);

            }
        }

    } else {

        console.log(FRUITS_AND_VEGGIES2);
        
        var i = 0;
        FRUITS_AND_VEGGIES2.forEach(function(element){

                var new_element = document.createElement("option");
                new_element.setAttribute('id', "orderListCriterion"+i);
                new_element.innerHTML = element;
                selectList.appendChild(new_element);
                i++;
        })

    }


}

$("#monselect").change(function(){

    alert('Selected value: ' + $(this).val());

    var ordercriterion = $(this).val();

    var cells = document.querySelectorAll('*[id^="cell"]');
    console.log(cells);
    console.log("hello there");
    var foundtaginCell = [];
    console.log(ordercriterion);
    
    for (i = 0; i < cells.length; i++) {
        
        var vidNo = cells[i].id.substring(4, cells[i].id.length);
        var cellTags = cells[i].querySelectorAll('*[id^="criterionName"]');
        console.log(vidNo);
        for (j = 0; j < cellTags.length; j++) {
            if (cellTags[j].innerHTML === ordercriterion) {

                var map = {};                                 
                map["cell"] = cells[i];
                console.log("cellNo:"+j+" vidNo:"+ vidNo );
                var tagNote = cells[i].querySelector('#globalNote'+j+'_'+vidNo).innerHTML;
                console.log(tagNote);
                map["tagValue"] = tagNote;
                console.log("hello there i found a tag");
                foundtaginCell.push(map);
            }

        }

    }

    console.log(foundtaginCell);

    foundtaginCell.sort(function (a, b) {
        a = parseFloat(a.tagValue);
        b = parseFloat(b.tagValue);
        return a > b ? -1 : a < b ? 1 : 0;
    });

    var mainFrame = document.getElementById("mainFrame1");
    mainFrame.innerHTML = "";
    for (i = 0; i < foundtaginCell.length; ++i) {
        mainFrame.appendChild(foundtaginCell[i].cell);
      }

    console.log(foundtaginCell);


});

