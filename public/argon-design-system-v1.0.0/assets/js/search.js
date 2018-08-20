function addSearchCriterion() {

    var mainSearch = document.getElementById("mainSearch0");
    var searchCell = document.getElementById("searchCell0");
    // '<div class="container" style="float: left;">' +

    var html = ' <div class="progress-wrapper " style="float: left;">' +
        '<div class="row col-sm-12 progress-info ">' +
        ' <div class="progress-label ">' +
        ' <span>'+ mainSearch.value +' </span></div>' +
        '<div class="progress-percentage" style="display: flex" >' +
        '<span style="color: rgba(248, 9, 176, 0.575)">40%</span>' +
            '</div>' +
            '</div>' +
            // '</div>' +
            // '</div>' +


            '<!-- Range slider -->'+
            '<div class="mt-5 row col-sm-12">'+
             ' <!-- Range slider container -->'+
              '<div id="input-slider-range" data-range-value-min="100"'+ 'data-range-value-max="500"></div>'+
              '<!-- Range slider values -->'+
              '<div class="row d-none">'+
                '<div class="col-6">'+
                  '<span class="range-slider-value value-low"'+ 'data-range-value-low="200"'+ 'id="input-slider-range-value-low"></span>'+
                '</div>'+
                '<div class="col-6 text-right">'+
                  '<span class="range-slider-value value-high"'+ 'data-range-value-high="400"'+ 'id="input-slider-range-value-high"></span>'+
                '</div>'+
             '</div>'+
            '</div>'+



            '</div>' ;


            var new_element = document.createElement("div");
            new_element.setAttribute('class', "row col-sm-12");
            new_element.innerHTML = html;

            searchCell.appendChild(new_element);


}