http://talkerscode.com/webtricks/add-edit-and-delete-rows-from-table-dynamically-using-javascript.php
console.log("tructruc");

// document.getElementById("myAnchor").addEventListener("click", function(event){
//     event.preventDefault()
// });
var array = document.querySelectorAll('*[id^="save_button"]'); 
console.log(array);
array.forEach(function(element){
    element.style.display = "none";});

var hidden = document.getElementById("custId0");
console.log(hidden);

function edit_row(no) {

    
    console.log("edit_button" + no);
    console.log(document.getElementById("edit_button" + no));
    document.getElementById("edit_button" + no).style.display = "none";
    document.getElementById("save_button" + no).style.display = "inline-block";
    console.log("progressBarContainer"+no);
    var demo = document.getElementById("progressBarContainer"+no);
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

    var max_div = document.getElementById("progressBarContainer"+videoNo);
    console.log(max_div);
    var array = max_div.querySelectorAll('*[id^="save_button"]'); 
    console.log(array);
    array.forEach(function(element){
        element.style.display = "none";});

    // var new_name=document.getElementById("new_name").value;
    // console.log(n_sliders);
    var truc = max_div.querySelectorAll("div.criterion");
    console.log(truc);
    var new_numero = truc.length + 1;
    console.log(new_numero);
    console.log($(".input-slider-container"));
    
    var html1 = '<div class=" progress-info flex-wrap">'+
                '<div class="progress-label flex-wrap">'+
                    '<span id="criterionName'+new_numero+ '">Task completed'+ '!!!!!!!!!!!!!!!!!!!!'+
                    '</span>'+
                    '<input type="hidden" id="custId'+new_numero+'">'+
                '</div>'+
                '<button type="button" id="edit_button'+new_numero+'" value="Edit" class="btn btn-sm btn-primary flex-wrap" onclick="edit_row('+new_numero+')" style="border-radius: 100vh">E</button>'+

                '<button type="button" id="save_button'+new_numero+'" value="Save" class="btn btn-sm btn-primary flex-wrap" onclick="save_row('+new_numero+')" style="border-radius: 100vh">S</button>'+


                '<div class="progress-percentage flex-wrap" style="display: inline-block; padding-right: 4px; padding-left: 4px;" >'+
                    '<span style="color:rgba(248, 9, 176, 0.575)" id="criterionNote'+new_numero+'">0.00</span>'+
                '</div>'+

                '<div class="progress-percentage flex-wrap" style="display: inline-block" >'+
                    '<span style="color:rgba(248, 9, 176, 0.575)" id="globalNote'+new_numero+'">0.00</span>'+
                '</div>'+

            '</div>'+

            '<div class="progress flex-wrap"  style="position: relative;">'+
                '<div class="progress-bar flex-wrap" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100" style="width: 25%; background-color: rgba(248, 9, 176, 0.575);"></div>'+
            
        '</div>';


  var html2 =  '<div id="input-slider'+new_numero+'" class="input-slider flex-wrap"  data-range-value-min="-100" data-range-value-max="100"></div>'+
            '<!-- Input slider values -->'+
  '<div class="row mt-3 d-none flex-wrap">'+
                '<div class="col-6">'+
                    '<span id="input-slider-value'+new_numero+'" class="range-slider-value flex-wrap" data-range-value-low="0"></span>'+
                '</div>'+
        '</div>';



    var new_element1 = document.createElement("div");
    new_element1.setAttribute('class', "progress-wrapper flex-wrap");
    // new_element.setAttribute('id', 'progressBar' + new_numero + '');
    // new_element.setAttribute('style', 'position: relative;');
    
    new_element1.innerHTML = html1;
    console.log(new_element1);
    max_div.appendChild(new_element1);


    var new_element2 = document.createElement("div");
    new_element2.setAttribute('class', "input-slider-container flex-wrap");
    new_element2.setAttribute('id', "slider-container"+new_numero);
    // new_element.setAttribute('style', 'position: relative;');
    
    new_element2.innerHTML = html2;
    console.log(new_element2);
    max_div.appendChild(new_element2);

    var newSliderContainer = new_element1.querySelector('#slider-container'+new_numero);

    console.log("new_element "+ new_element2);
    console.log("newSliderContainer "+ newSliderContainer);

    initializeSlider(new_element2,new_element1, new_numero);
    
    console.log(new_element2)    

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
    