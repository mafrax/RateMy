function link_slider(slider) {

    console.log(slider);
    console.log(slider.parentElement);
    var match = slider.id.match(/\d+/);
    var div_number = parseInt(match[0], 10);
    var brother = document.getElementById("sima" + div_number);
    console.log(brother);
    console.log(div_number);
    var counter = document.getElementById("counter" + div_number);
    console.log(slider.value);
    counter.innerHTML = slider.value;
    brother.style.width = 50 + slider.value / 2 + "%";
    brother.style.opacity = 1;
}


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
    var name = document.getElementById("title" + no);
    var name_data = name.innerHTML;
    name.innerHTML = "<input type='text' id='name_text" + no + "' value='" + name_data + "'>";
}

function save_row(no) {
    var name_val = document.getElementById("name_text" + no).value;
    var hidden_field = document.getElementById("custId" + no);
    console.log(hidden_field);
    hidden_field.setAttribute("value", name_val);
    document.getElementById("title" + no).innerHTML = name_val;
    document.getElementById("edit_button" + no).style.display = "inline-block";
    document.getElementById("save_button" + no).style.display = "none";
}

function add_criterion() {
    // var new_name=document.getElementById("new_name").value;
    // console.log(n_sliders);
    var max_div = document.getElementById("progressBarContainer1");
    var truc = max_div.querySelectorAll("div.criterion");
    console.log(truc);
    var new_numero = truc.length + 1;
    console.log(new_numero);
    console.log($(".input-slider-container"));
    var table = document.getElementById("progressBarContainer1");
    var html =  '<div class="progress-wrapper ">'+
                    '<div class=" progress-info ">'+
                '<div class="progress-label ">'+
                    '<span>Task completed !!!!!!!!!!!!!!!!!!!!'+
                    '</span>'+
                '</div>'+
                '<button type="button" id="edit_button'+new_numero+'" value="Edit" class="btn btn-sm btn-primary " onclick="edit_row('+new_numero+')" style="border-radius: 100vh">E</button>'+

                '<div class="progress-percentage" style="display: flex" >'+
                    '<span style="color:rgba(248, 9, 176, 0.575)">40%</span>'+
                '</div>'+
            '</div>'+

            '<div class="progress">'+
                '<div class="progress-bar" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100" style="width: 25%; background-color: rgba(248, 9, 176, 0.575);"></div>'+
            '</div>'+
        '</div>'+


        '<div class="input-slider-container" id="slider-container'+new_numero+'">'+
            '<div id="input-slider'+new_numero+'" class="input-slider" data-range-value-min="100" data-range-value-max="500"></div>'+
            '<!-- Input slider values -->'+
  '<div class="row mt-3 d-none">'+
                '<div class="col-6">'+
                    '<span id="input-slider-value'+new_numero+'" class="range-slider-value" data-range-value-low="100"></span>'+
                '</div>'+
            '</div>'+
        '</div>';



    var new_element = document.createElement("div");
    new_element.setAttribute('class', "criterion");
    new_element.setAttribute('id', 'progressBar' + new_numero + '');
    new_element.innerHTML = html;
    console.log(new_element);
    table.appendChild(new_element);

    var newSliderContainer = new_element.querySelector('#slider-container'+new_numero);

    console.log("new_element"+ new_element);
    console.log("newSliderContainer"+ newSliderContainer);

    initializeSlider(newSliderContainer);
    
    document.getElementById("save_button" + new_numero).style.display = "none";
    

}

function initializeSlider(slider){

    console.log(slider);

    var sliderId = slider.('id');
    var minValue = slider.data('range-value-min');
    var maxValue = slider.data('range-value-max');
    
    var sliderValue = $(this).find('.range-slider-value');
    var sliderValueId = sliderValue.attr('id');
    var startValue = sliderValue.data('range-value-low');
    
    var c = document.getElementById(sliderId),
    d = document.getElementById(sliderValueId);
    
    noUiSlider.create(c, {
        start: [parseInt(startValue)],
        connect: [true, false],
        //step: 1000,
        range: {
            'min': [parseInt(minValue)],
            'max': [parseInt(maxValue)]
        }
    });
    
    c.noUiSlider.on('update', function(a, b) {
        d.textContent = a[b];
    });
}
    