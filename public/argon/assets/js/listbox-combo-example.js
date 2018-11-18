/*
*   This content is licensed according to the W3C Software License at
*   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
*
* ARIA Combobox Examples
*/


var FRUITS_AND_VEGGIES = [];
FRUITS_AND_VEGGIES.push("Upload date");
FRUITS_AND_VEGGIES.push("Global Note");
FRUITS_AND_VEGGIES.push("Number of views");
var FRUITS_AND_VEGGIES2 = [];


  function updateVeggies(results){
    FRUITS_AND_VEGGIES = [];

    FRUITS_AND_VEGGIES2 = [];
 
    // console.log(results);
    for (var i = 0; i < results.length; i++) {       
            FRUITS_AND_VEGGIES.push(results[i]);
            FRUITS_AND_VEGGIES2.push(results[i]);      
    }
    // console.log(FRUITS_AND_VEGGIES);

    FRUITS_AND_VEGGIES2.sort(function (a, b) {
      return a < b ? -1 : a > b ? 1 : 0;
  });


  }
  
  function searchVeggies(searchString) {
    var results = [];
  
    for (var i = 0; i < FRUITS_AND_VEGGIES.length; i++) {
      
      var veggie1 = FRUITS_AND_VEGGIES[i];
      var veggie = veggie1.toString().toLowerCase();
      if (veggie.indexOf(searchString) === 0) {
        results.push(FRUITS_AND_VEGGIES[i]);
      }
    }
    results.sort(function (a, b) {
      return a < b ? -1 : a > b ? 1 : 0;
  });

    return results;
  }

  function searchVeggiesPlus(searchString) {
    var results = [];
    
    for (var i = 0; i < FRUITS_AND_VEGGIES2.length; i++) {
      var veggie = FRUITS_AND_VEGGIES2[i].toLowerCase();
      if (veggie.indexOf(searchString.toLowerCase()) === 0) {
        results.push(FRUITS_AND_VEGGIES2[i]);
      }
    }
    results.sort(function (a, b) {
      return a < b ? -1 : a > b ? 1 : 0;
    });

    return results;
  }

  function searchVeggiesPlusPlus(searchString, no) {
    var results = [];
    criterionContainer = document.getElementById("progressBarContainer"+no);
    criterii = criterionContainer.querySelectorAll("*[id^=criterionName]");
    var criterionList = [];
    for (var prop in criterii) {
      if (criterii.hasOwnProperty(prop)) {
        criterionList.push(criterii[prop].innerHTML);
      }
    }
    for (var i = 0; i < criterionList.length; i++) {
      var veggie = criterionList[i].toLowerCase();
      if (veggie.indexOf(searchString.toLowerCase()) === 0) {
        results.push(criterionList[i]);
      }
    }

    results.sort(function (a, b) {
      return a < b ? -1 : a > b ? 1 : 0;
    });
  
    return results;
  }
  
  function initializeCombobox1(no){
      // console.log("lalala");
      // console.log(no);
    var ex1Combobox = new aria.ListboxCombobox(
      document.getElementById('ex1-combobox'+no),
      document.getElementById('ex1-input'+no),
      document.getElementById('ex1-listbox'+no),
      searchVeggies,
      false
    );
  }

  function initializeCustomCombobox1(no){

    // console.log("lalala");
    // console.log(no);
  var ex1Combobox = new aria.ListboxCombobox(
    document.getElementById('ex1-combobox'+no),
    document.getElementById('ex1-input'+no),
    document.getElementById('ex1-listbox'+no),
    searchVeggiesPlusPlus,
    false
  );
}

  function initializeCombobox3(no){
    var ex3Combobox = new aria.ListboxCombobox(      
      document.getElementById('ex3-combobox'+no),
      document.getElementById('ex3-input'+no),
      document.getElementById('ex3-listbox'+no),
      searchVeggiesPlus,
      true,
      function () {
        // on show
        document.getElementById('ex3-combobox-arrow'+no)
          .setAttribute('aria-label', 'Hide vegetable options');
      },
      function () {
        // on hide
        document.getElementById('ex3-combobox-arrow'+no)
          .setAttribute('aria-label', 'Show vegetable options');
      }
    );
  
    document.getElementById('ex3-combobox-arrow'+no).addEventListener(
      'click',
      function () {
        if (ex3Combobox.shown) {
          document.getElementById('ex3-input'+no).focus();
          ex3Combobox.hideListbox();
        }
        else {
          document.getElementById('ex3-input'+no).focus();
          // console.log('hi8');
          ex3Combobox.updateResults(true);
        }
      }
    );

};