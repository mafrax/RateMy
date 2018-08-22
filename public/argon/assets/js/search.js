function addSearchCriterion() {

    var mainSearch = document.getElementById("mainSearch0");
    var searchCell = document.getElementById("searchCell0");
    // '<div class="container" style="float: left;">' +
    var truc = document.querySelectorAll("[id^='searchCriterion']");
    var no = truc.length+1;
    console.log(no);
    console.log(truc);
    console.log($('.comon-slider-range'));
    console.log($(".input-slider-container"));

    var html = ' <div class="progress-wrapper col-12" style="float: left;">' +
        '<div class="progress-info ">' +
        ' <div class="progress-label ">' +
        ' <span>'+ mainSearch.value +' </span></div>' +
        '<div class="progress-percentage" style="display: flex" >' +
        '<span style="color: rgba(248, 9, 176, 0.575)">40%</span>' +
            '</div>' +
            '</div>' +
            // '</div>' +
            // '</div>' +


            '<!-- Range slider -->'+
            '<div class="common-class">'+
             ' <!-- Range slider container -->'+
              '<div class="comon-slider-range" id="input-slider-range'+no+'" data-range-value-min="100"'+ 'data-range-value-max="500"></div>'+
              '<!-- Range slider values -->'+
              '<div class="row d-none">'+
                '<div class="col-12">'+
                  '<span class="range-slider-value value-low"'+ 'data-range-value-low="200"'+ 'id="input-slider-range-value-low'+no+'"></span>'+
                '</div>'+
                '<div class="col-12 text-right">'+
                  '<span class="range-slider-value value-high"'+ 'data-range-value-high="400"'+ 'id="input-slider-range-value-high'+no+'"></span>'+
                '</div>'+
             '</div>'+
            '</div>'+



            '</div>' ;


            var new_element = document.createElement("div");
            new_element.setAttribute('class', "row col-sm-12");
            new_element.setAttribute('id', "searchCriterion"+no);
            new_element.innerHTML = html;

            searchCell.appendChild(new_element);


              var c = document.getElementById("input-slider-range"+no),
                  d = document.getElementById("input-slider-range-value-low"+no),
                  e = document.getElementById("input-slider-range-value-high"+no),
                  f = [d, e];
      
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
                  f[b].textContent = a[b]
              })

              console.log(d.getAttribute('data-range-value-low'));

}