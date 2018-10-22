http://talkerscode.com/webtricks/add-edit-and-delete-rows-from-table-dynamically-using-javascript.php
console.log("tructruc");

// document.getElementById("myAnchor").addEventListener("click", function(event){
//     event.preventDefault()
// });

function initializeButoons() {
    var array = document.querySelectorAll('*[id^="cell"]');
    console.log(array);
    array.forEach(function (element) {
        var buttons = element.querySelectorAll('*[id^="save_button"]');
        console.log(buttons);
        buttons.forEach(function (button) {
            button.style.display = "none";
        })
    });
}

var hidden = document.getElementById("custId0");
console.log(hidden);

function edit_row(no, videoNo) {

    document.getElementById("edit_button" + no + "_" + videoNo).style.display = "none";
    document.getElementById("save_button" + no + "_" + videoNo).style.display = "inline-block";

    var demo = document.getElementById("progressBarContainer" + videoNo);

    var name = demo.querySelector("#criterionName" + no + '_' + videoNo);
    var name_data = name.innerHTML;
    name.innerHTML = "<input type='text' id='name_text" + no + "_" + videoNo + "' value='" + name_data + "'>";
}

function save_row(no, videoNo) {
    var name_val = document.getElementById("name_text" + no + "_" + videoNo).value;
    var hidden_field = document.getElementById("custId" + no);

    hidden_field.setAttribute("value", name_val);
    document.getElementById("criterionName" + no + "_" + videoNo).innerHTML = name_val;
    document.getElementById("edit_button" + no + "_" + videoNo).style.display = "inline-block";
    document.getElementById("save_button" + no + "_" + videoNo).style.display = "none";
}

function add_criterion(videoNo, newOrFound, criterionTitle, level) {

    console.log(videoNo);
    var max_div = document.getElementById("progressBarContainer" + videoNo);

    if (newOrFound === true) {
        console.log('true');
        var array = max_div.querySelectorAll('*[id^="save_button"]');
        console.log(level);
        array.forEach(function (element) {
            element.style.display = "none";
        });
        inputField = document.getElementById('criterionAddField' + videoNo);
        criterionTitle = inputField.value;
        level = 0;
    }
    console.log(criterionTitle);
    // var new_name=document.getElementById("new_name").value;
    // console.log(n_sliders);
    var truc = max_div.querySelectorAll("div.progress-label");
    var new_numero = truc.length;
    var levelGlobal = 50 + level / 2;
    var html1 = '<div class=" progress-info flex-wrap">' +
        '<div class="progress-label flex-wrap">' +
        '<span class="criterionTitle" id="criterionName' + new_numero + '_' + videoNo + '">' + criterionTitle +
        '</span>' +
        '<input type="hidden" id="custId' + new_numero + '">' +
        '</div>' +
        '<button type="button" id="edit_button' + new_numero + '_' + videoNo + '" value="Edit" class="btn btn-sm btn-primary flex-wrap" onclick="edit_row(' + new_numero + ',' + videoNo + ')" style="border-radius: 100vh">E</button>' +

        '<button type="button" id="save_button' + new_numero + '_' + videoNo + '" value="Save" class="btn btn-sm btn-primary flex-wrap" onclick="save_row(' + new_numero + ',' + videoNo + ')" style="border-radius: 100vh">S</button>' +




        '<div class="progress-percentage flex-wrap" >' +
        '<span style="color:rgba(248, 9, 176, 0.575)" id="globalNote' + new_numero + '_' + videoNo + '">' + level + '</span>' +
        '</div>' +

        '<div class="progress-percentage flex-wrap" style="padding-right: 4px; padding-left: 4px;" >' +
        '<span style="color: rgba(94, 114, 228)" id="criterionNote' + new_numero + '_' + videoNo + '">0.00</span>' +
        '</div>' +

        '</div>' +

        '<div class="progress flex-wrap"  >' +
        '<div class="progress-bar flex-wrap" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100" style="width: ' + levelGlobal + '%; background-color: rgba(248, 9, 176, 0.575);"></div>' +
        '</div>';


    var html2 = '<div id="input-slider' + new_numero + '" class="input-slider flex-wrap"  data-range-value-min="-100" data-range-value-max="100"></div>' +
        '<!-- Input slider values -->' +
        '<div class="row mt-3 d-none flex-wrap">' +
        '<div class="col-6">' +
        '<span id="input-slider-value' + new_numero + '" class="range-slider-value flex-wrap" data-range-value-low="0"></span>' +
        '</div>' +
        '</div>';

    var html3 = '<div class=" progress-info flex-wrap">' +
        '<div class="progress-label flex-wrap">' +
        '<span class="criterionTitle" id="criterionName' + videoNo + '_' + new_numero + '">' + criterionTitle +
        '</span>' +
        '<input type="hidden" id="custId' + new_numero + '">' +
        '</div>' +


        '<div class="progress-percentage flex-wrap" >' +
        '<span style="color:rgba(248, 9, 176, 0.575)" id="globalNote' + new_numero + '_' + videoNo + '">' + level + '</span>' +
        '</div>' +

        '<div class="progress-percentage flex-wrap" style="padding-right: 4px; padding-left: 4px;" >' +
        '<span style="color: rgba(94, 114, 228)" id="criterionNote' + new_numero + '_' + videoNo + '">0.00</span>' +
        '</div>' +

        '</div>' +

        '<div class="progress flex-wrap"  >' +
        '<div class="progress-bar flex-wrap" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100" style="width: ' + levelGlobal + '%; background-color: rgba(248, 9, 176, 0.575);"></div>' +
        '</div>';

    var new_element1 = document.createElement("div");
    new_element1.setAttribute('class', "progress-wrapper flex-wrap");
    new_element1.setAttribute('id', 'wrapper' + videoNo + '_' + new_numero + '');
    // new_element.setAttribute('style', 'position: relative;');

    if (newOrFound === true) {
        new_element1.innerHTML = html1;
        max_div.appendChild(new_element1);
    } else {
        new_element1.innerHTML = html3;
        max_div.appendChild(new_element1);
    }


    var new_element2 = document.createElement("div");
    new_element2.setAttribute('class', "input-slider-container flex-wrap");
    new_element2.setAttribute('id', "slider-container" + new_numero);
    // new_element.setAttribute('style', 'position: relative;');

    new_element2.innerHTML = html2;
    max_div.appendChild(new_element2);

    var newSliderContainer = new_element1.querySelector('#slider-container' + new_numero);


    initializeSlider(new_element2, new_element1, new_numero, videoNo);

    if (newOrFound === true) {
        document.getElementById("save_button" + new_numero + "_" + videoNo).style.display = "none";
    }



}

function initializeSlider(sliderContainer, new_element, new_numero, videoNo) {


    var slider = sliderContainer.querySelector('#input-slider' + new_numero);
    var sliderPercent = new_element.querySelector("#criterionNote" + new_numero + '_' + videoNo);
    var maxValue = slider.getAttribute("data-range-value-max");
    var minValue = slider.getAttribute("data-range-value-min");
    var sliderValue = sliderContainer.querySelector('#input-slider-value' + new_numero);
    var startValue = sliderValue.getAttribute("data-range-value-low");
    noUiSlider.create(slider, {
        start: [parseInt(startValue)],
        connect: [true, false],
        //step: 1000,
        range: {
            'min': [parseInt(minValue)],
            'max': [parseInt(maxValue)]
        }
    });

    slider.noUiSlider.on('update', function (a, b) {
        sliderValue.textContent = a[b];
        console.log(sliderValue);
        sliderPercent.innerHTML = sliderValue.innerHTML;
    });
}

function filterCriterion(videoNo) {


    var collapsable = document.getElementById("demo" + videoNo);
    collapsable.setAttribute("class", "col-12 collapse show");

    var container = document.getElementById("progressBarContainer" + videoNo);
    var videoCriterions = container.querySelectorAll("*[id^=criterionName" + videoNo + "_]");
    var value = document.getElementById("searchVideoBar" + videoNo).value.toUpperCase();
    var criterionContainersToKeep = [];

    if (value === "") {
        var wrappers = container.querySelectorAll("*[id^=wrapper" + videoNo + "]");
        wrappers.forEach(function (element) {
            element.style.display = "initial";
        })
        var sliders = container.querySelectorAll("*[id^=slider-container" + prop);
        sliders.forEach(function (element) {
            element.style.display = "initial";
        })
    } else {
        for (prop in videoCriterions) {
            if (videoCriterions.hasOwnProperty(prop)) {

                var name = videoCriterions[prop].innerHTML.toUpperCase();
                console.log(name);
                console.log(value);
                console.log(prop);

                // var criterionNum =videoCriterions[prop].id.substring(13, videoCriterions[prop].id.length);
                // console.log(videoCriterions[prop].id);
                // console.log(videoCriterions[prop].id.length);
                // console.log(criterionNum);
                if (name.startsWith(value)) {
                    // criterionContainersToKeep.push(document.getElementById("wrapper"+videoNo+"_"+prop))
                    console.log("yep");
                } else {
                    console.log("nop");
                    document.getElementById("wrapper" + videoNo + "_" + prop).style.display = 'none';
                    container.querySelector("#slider-container" + prop).style.display = 'none';
                }
            }
        }
    }





}
