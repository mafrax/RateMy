
// $("#ex1-input").on('keyup', function (e) {
//     if (e.keyCode == 13) {
//         addSearchCriterion();  
//         console.log($("#ex1-input")) ;
//         $("#ex1-input").val('');   
//     }
// });

$('#mainSearchButton').mouseleave(function(){
    console.log("focusout");
    $(this).tooltip('hide')
    .attr('data-original-title', "Here you can add as many search criterii as you want. Each criterion can be searched with a lower and higher value. Use this to find your perfect porn video")
});


function addSearchCriterion() {

    

    var mainSearch = document.getElementById("ex1-input0");
    var searchCellContainer = document.getElementById("searchCellContainer");
    var searchCell = document.getElementById("searchCell");
    var mainSearchButton = document.getElementById("mainSearchButton");
    
    if(mainSearch.value == ""){
        console.log(mainSearchButton.title);
        // $('#mainSearchButton').tooltip('hide');
        // mainSearchButton.setAttribute("title", "Please enter a valid search criterion");
        // $('#mainSearchButton').tooltip('show');

        $('#mainSearchButton').tooltip('hide')
          .attr('data-original-title', "Please enter a valid search criterion")
          .tooltip('show');

          $('#collapseSearchButton').hide();
        
    } else {

        var truc = document.querySelectorAll("[id^='searchCriterion']");
        var no = truc.length+1;
        console.log(no);
        console.log(truc);
        console.log($('.comon-slider-range'));
        console.log($(".input-slider-container"));
    
        var html = ' <div class="progress-wrapper">' +
            '<div class="progress-info flex-wrap">' +
            ' <div class="progress-label ">' +
            ' <span id="spanCriterionName'+no+'">'+ mainSearch.value +' </span></div>' +
            '<div class="progress-percentage" style="display: flex" >' +
            '<span style="color: rgba(248, 9, 176, 0.575); margin-right: 10px" id="criterionLowRange'+no+'">40%</span>' +
            '<span style="color: rgba(248, 9, 176, 0.575); margin-right: 10px" id="criterionHighRange'+no+'">40%</span>' +
            
                '</div>' +
                '<button style="border: transparent; position: relative; display: inline-block;'+
                'text-align: left; opacity: 100; border-radius: 50%;" class="btn-inner--icon"  id="deletesearchCriterion'+no+'" tabindex="-1"  aria-label="Show vegetable options" onclick="deleteSearchCriterion('+no+')">'+
                     '<i class="ni ni-fat-remove" style="color:tomato"></i>'+
                  '</button>'+
    
                '</div>' +
    
    
    
                '<!-- Range slider -->'+
                '<div class="common-class">'+
                 ' <!-- Range slider container -->'+
                  '<div class="comon-slider-range" id="input-slider-range'+no+'" data-range-value-min="-100"'+ 'data-range-value-max="100"></div>'+
                  '<!-- Range slider values -->'+
                  '<div class="row d-none">'+
                    '<div class="">'+
                      '<span class="range-slider-value value-low"'+ 'data-range-value-low="-100"'+ 'id="input-slider-range-value-low'+no+'"></span>'+
                    '</div>'+
                    '<div class="text-right">'+
                      '<span class="range-slider-value value-high"'+ 'data-range-value-high="100"'+ 'id="input-slider-range-value-high'+no+'"></span>'+
                    '</div>'+
                    
                 '</div>'+
                '</div>'+
    
    
    
                '</div>' ;
    
    
                var new_element = document.createElement("div");
                new_element.setAttribute('id', "searchCriterion"+no);
                new_element.setAttribute('class', "flex-wrap");
                new_element.setAttribute('style', "max-weight:100%; padding-right:10px;");
                new_element.innerHTML = html;
    
                searchCellContainer.appendChild(new_element);
                searchCell.setAttribute("class", "col-12 collapse show");
    
    
                  var c = document.getElementById("input-slider-range"+no),
                      d = document.getElementById("input-slider-range-value-low"+no),
                      e = document.getElementById("input-slider-range-value-high"+no),
                      f = [d, e],
                      g = document.getElementById("criterionLowRange"+no),
                      h = document.getElementById("criterionHighRange"+no);
          
                  console.log(c) ; 
                  console.log(d) ; 
                  console.log(e) ; 
                  console.log(f) ; 
    
    
                  noUiSlider.create(c, {
    
                    
                      start: [parseInt(d.getAttribute('data-range-value-low')), parseInt(e.getAttribute('data-range-value-high'))],
                      connect: true,
                      range: {
                          min: parseInt(c.getAttribute('data-range-value-min')),
                          max: parseInt(c.getAttribute('data-range-value-max'))
                      }
                  }), c.noUiSlider.on("update", function(a, b) {
                      f[b].textContent = a[b];
                      g.innerHTML = d.innerHTML;
                      h.innerHTML = e.innerHTML;
                  })
    
                  console.log(d.getAttribute('data-range-value-low'));
                  console.log($('#collapseSearchButton'));
                  $('#collapseSearchButton').show();
    }
    fillOrderList();

}

function deleteSearchCriterion(no) {

   var searchCriterion = document.getElementById("searchCriterion"+no);
   var searchCellContainer = document.getElementById("searchCellContainer");
   searchCellContainer.removeChild(searchCriterion);
   var remains = searchCellContainer.querySelectorAll("[id^='searchCriterion']");
   console.log(remains);
   if(remains.length===0){

    var mainFrame = document.getElementById("mainFrame1");
    mainFrame.innerHTML = "";
    console.log(ALL_VID);
    for (i = 0; i < ALL_VID.length; i++) {
        mainFrame.appendChild(ALL_VID[i]);
      }
      $('#collapseSearchButton').click();
      $('#collapseSearchButton').hide();
      fillOrderList();
    //    window.location.replace("/");
   }

}

function orderUp() {

    var button = document.getElementById("orderButton");
    if(button.getAttribute('class') === "ni ni-bold-down"){
        button.setAttribute('class',"ni ni-bold-up");
    } else {
        button.setAttribute('class',"ni ni-bold-down");
    }
    
 }

 function validateSearch(){
     
 }