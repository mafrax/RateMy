function orderUp() {

    var criterion = document.getElementById("orderCriterionNameValidated").innerHTML;
    var ordercriterion;

    switch (criterion) {
        case "Upload Date":
            ordercriterion = "timeStamp";
            break;
        // case y:
        //     break;
        // case y:
        //     break;
        default:
            ordercriterion = criterion;
    }


    var cells = document.querySelectorAll('*[id^="cell"]');
    console.log(cells);
    console.log("hello there");
    var foundtaginCell = [];

    for (i = 0; i < cells.length; i++) {

        var cellTags = cells[i].querySelectorAll('span.criterionTitle');
        var cellNo = cells[i].id.substring(4, cells[i].id.length);
        console.log(cellNo);
        for (j = 0; j < cellTags.length; j++) {

            if (cellTags[j].innerHTML === ordercriterion) {
                var map = {}                                 
                map["cell"] = cells[i];
                var tagNote = cells[i].querySelector('#globalNote'+j+'_'+cellNo).innerHTML;
                console.log(tagNote);
                map["tagValue"] = tagNote;
                console.log("hello there i found a tag");
                foundtaginCell.push(map);
            }

        }


    }

    console.log(foundtaginCell);

    foundtaginCell.sort(function (a, b) {
        a = a.tagValue;
        b = b.tagValue;
        return a > b ? -1 : a < b ? 1 : 0;
    });

    console.log(foundtaginCell);

}