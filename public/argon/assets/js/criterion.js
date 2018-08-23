http://talkerscode.com/webtricks/add-edit-and-delete-rows-from-table-dynamically-using-javascript.php
console.log("tructruc");
document.getElementById("save_button0").style.display = "none";
var hidden = document.getElementById("custId0");
console.log(hidden);

function edit_row(no) {
    console.log("edit_button" + no);
    console.log(document.getElementById("edit_button" + no));
    document.getElementById("edit_button" + no).style.display = "none";
    document.getElementById("save_button" + no).style.display = "inline-block";
    var demo = document.getElementById("progressBar"+no);
    console.log(demo);
    var name = demo.querySelector("#criterionName"+no);
    var name_data = name.innerHTML;
    name.innerHTML = "<input type='text' id='name_text" + no + "' value='" + name_data + "'>";
}

function save_row(no) {
    var name_val = document.getElementById("name_text" + no).value;
    var hidden_field = document.getElementById("custId" + no);
    console.log(hidden_field);
    hidden_field.setAttribute("value", name_val);
    document.getElementById("criterionName" + no).innerHTML = name_val;
    document.getElementById("edit_button" + no).style.display = "inline-block";
    document.getElementById("save_button" + no).style.display = "none";
}

function add_criterion(videoNo) {
    // var new_name=document.getElementById("new_name").value;
    // console.log(n_sliders);
    var max_div = document.getElementById("progressBarContainer"+videoNo);
    var truc = max_div.querySelectorAll("div.criterion");
    console.log(truc);
    var new_numero = truc.length + 1;
    console.log(new_numero);
    console.log($(".input-slider-container"));
    
    var html =  '<div class="progress-wrapper ">'+
                    '<div class=" progress-info ">'+
                '<div class="progress-label ">'+
                    '<span id="criterionName'+new_numero+ '">Task completed'+ '!!!!!!!!!!!!!!!!!!!!'+
                    '</span>'+
                    '<input type="hidden" id="custId'+new_numero+'">'+
                '</div>'+
                '<button type="button" id="edit_button'+new_numero+'" value="Edit" class="btn btn-sm btn-primary " onclick="edit_row('+new_numero+')" style="border-radius: 100vh">E</button>'+

                '<button type="button" id="save_button'+new_numero+'" value="Save" class="btn btn-sm btn-primary " onclick="save_row('+new_numero+')" style="border-radius: 100vh">S</button>'+


                '<div class="progress-percentage" style="display: flex" >'+
                    '<span style="color:rgba(248, 9, 176, 0.575)" id="criterionNote'+new_numero+'">40%</span>'+
                '</div>'+
            '</div>'+

            '<div class="progress">'+
                '<div class="progress-bar" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100" style="width: 25%; background-color: rgba(248, 9, 176, 0.575);"></div>'+
            '</div>'+
        '</div>'+


        '<div class="input-slider-container" id="slider-container'+new_numero+'">'+
            '<div id="input-slider'+new_numero+'" class="input-slider" data-range-value-min="-100" data-range-value-max="100"></div>'+
            '<!-- Input slider values -->'+
  '<div class="row mt-3 d-none">'+
                '<div class="col-6">'+
                    '<span id="input-slider-value'+new_numero+'" class="range-slider-value" data-range-value-low="0"></span>'+
                '</div>'+
            '</div>'+
        '</div>';



    var new_element = document.createElement("div");
    new_element.setAttribute('class', "criterion");
    new_element.setAttribute('id', 'progressBar' + new_numero + '');
    new_element.innerHTML = html;
    console.log(new_element);
    max_div.appendChild(new_element);

    var newSliderContainer = new_element.querySelector('#slider-container'+new_numero);

    console.log("new_element"+ new_element);
    console.log("newSliderContainer"+ newSliderContainer);

    initializeSlider(newSliderContainer,new_element, new_numero);
    
    document.getElementById("save_button" + new_numero).style.display = "none";
    

}

function initializeSlider(sliderContainer,new_element, new_numero){

    console.log(sliderContainer);

    var slider = sliderContainer.querySelector('#input-slider'+new_numero);
    console.log(slider);
   var sliderPercent = new_element.querySelector("#criterionNote"+new_numero);
    console.log(slider.id);
    var maxValue = slider.getAttribute("data-range-value-max");
    var minValue = slider.getAttribute("data-range-value-min");
    console.log(maxValue);
    console.log(minValue);
    var sliderValue = sliderContainer.querySelector('#input-slider-value'+new_numero);
    console.log(sliderValue);
    var startValue = sliderValue.getAttribute("data-range-value-low");
    console.log(startValue);
    noUiSlider.create(slider, {
        start: [parseInt(startValue)],
        connect: [true, false],
        //step: 1000,
        range: {
            'min': [parseInt(minValue)],
            'max': [parseInt(maxValue)]
        }
    });
    
    slider.noUiSlider.on('update', function(a, b) {
        sliderValue.textContent = a[b];
        console.log(sliderValue);
        sliderPercent.innerHTML = sliderValue.innerHTML ;
    });
}
    