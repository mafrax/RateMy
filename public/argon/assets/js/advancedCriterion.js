function moveTosearchBlock (tag, block, bool) {
  console.log(bool)
  console.log('truc')
  console.log(tag)
  console.log(Object.keys(tag))
  if (!block) {
    if (!bool) {
      block = document.querySelector('#defaultBlock')
      console.log(block)
    } else {
      block = document.querySelector('#orBlock')
      console.log(block)
    }
  }
  console.log(block)
  var ol = block.querySelector('.defaultCriterionContainer')
  console.log(ol)
  var newCriterion = document.createElement('li')
  newCriterion.setAttribute('style', 'color: aliceblue')
  newCriterion.innerHTML = tag

  var criterions = document.querySelectorAll('*[id^="searchCriterion"]')

  var no = criterions.length + 1
  var rangeCriterion = createRangeCriterion(tag, no)

  ol.appendChild(rangeCriterion)
  initializeRangeInitializeSlider(no)
}

var createRangeCriterion = function (tagName, no) {
  var html = ' <div class="progress-wrapper">' +
    '<div class="progress-info flex-wrap">' +
    ' <div class="progress-label ">' +
    ' <span id="spanCriterionName' + no + '">' + tagName + ' </span></div>' +
    '<div class="progress-percentage" style="display: flex" >' +
    '<span style="color: rgba(255, 255, 255); margin-right: 10px" id="criterionLowRange' + no + '">40%</span>' +
    '<span style="color: rgba(255,255,255); margin-right: 10px" id="criterionHighRange' + no + '">40%</span>' +

        '</div>' +
        '<button style="border: transparent; position: relative; display: inline-block;' +
        'text-align: left; opacity: 100; border-radius: 50%;" class="btn-inner--icon"  id="deletesearchCriterion' + no + '" tabindex="-1"  aria-label="Show vegetable options" onclick="deleteSearchCriterion(' + no + ')">' +
             '<i class="ni ni-fat-remove" style="color:tomato"></i>' +
          '</button>' +

        '</div>' +

        '<!-- Range slider -->' +
        '<div class="common-class">' +
         ' <!-- Range slider container -->' +
          '<div class="comon-slider-range" id="input-slider-range' + no + '" data-range-value-min="0"' + 'data-range-value-max="100"></div>' +
          '<!-- Range slider values -->' +
          '<div class="row d-none">' +
            '<div class="">' +
              '<span class="range-slider-value value-low"' + 'data-range-value-low="0"' + 'id="input-slider-range-value-low' + no + '"></span>' +
            '</div>' +
            '<div class="text-right">' +
              '<span class="range-slider-value value-high"' + 'data-range-value-high="100"' + 'id="input-slider-range-value-high' + no + '"></span>' +
            '</div>' +

         '</div>' +
        '</div>' +

        '</div>'

  var new_element = document.createElement('div')
  new_element.setAttribute('id', 'searchCriterion' + no)
  new_element.setAttribute('class', 'flex-wrap')
  new_element.setAttribute('style', 'max-weight:100%; padding-right:10px;')
  new_element.innerHTML = html

  return new_element
}

function initializeRangeInitializeSlider (no) {
  var c = document.getElementById('input-slider-range' + no)
    var d = document.getElementById('input-slider-range-value-low' + no)
    var e = document.getElementById('input-slider-range-value-high' + no)
    var f = [d, e]
    var g = document.getElementById('criterionLowRange' + no)
    var h = document.getElementById('criterionHighRange' + no)

  noUiSlider.create(c, {

    start: [parseInt(d.getAttribute('data-range-value-low')), parseInt(e.getAttribute('data-range-value-high'))],
    connect: true,
    range: {
      min: parseInt(c.getAttribute('data-range-value-min')),
      max: parseInt(c.getAttribute('data-range-value-max'))
    }
  }), c.noUiSlider.on('update', function (a, b) {
    f[b].textContent = a[b]
    g.innerHTML = d.innerHTML
    h.innerHTML = e.innerHTML
  })
}

const computeAdvancedSearchQuery = function () {
  var andBlock = document.getElementById('defaultBlock')
 var orBlock = document.getElementById('orBlock')


 var andCriterions = andBlock.querySelectorAll('*[id^="searchCriterion"]')

 quer =''
 
 var i = 0
 andCriterions.forEach(criterions => {
   
   quer += 'MATCH (v)-[r'+i+':RATED]->(tag'+i+':Tag) \n WHERE '

    var name = criterions.querySelectorAll('*[id^="spanCriterionName"]')[0].innerHTML.trim()
   
   var lowRange = criterions.querySelectorAll('*[id^="criterionLowRange"]')[0].innerHTML

   var highRange = criterions.querySelectorAll('*[id^="criterionHighRange"]')[0].innerHTML

   quer += 'tag'+i+'.tagName ="'+ name +'" and r'+i+'.level<='+highRange+' and r'+i+'.level>='+ lowRange+'\n'
 i++
  })

  quer += 'return v'


  return quer;

}


function showQuery(){

  var queryContainer = document.getElementById('queryContainer')

  queryContainer.innerHTML = computeAdvancedSearchQuery()
}


function isEven(n) {
  return n % 2 == 0;
}