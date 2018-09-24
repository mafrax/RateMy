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
FRUITS_AND_VEGGIES2.push("Upload date");
FRUITS_AND_VEGGIES2.push("Global Note");
FRUITS_AND_VEGGIES2.push("Number of views");

  function updateVeggies(results){
    FRUITS_AND_VEGGIES = [];
    FRUITS_AND_VEGGIES.push("Upload date");
FRUITS_AND_VEGGIES.push("Global Note");
FRUITS_AND_VEGGIES.push("Number of views");
    FRUITS_AND_VEGGIES2 = [];
    FRUITS_AND_VEGGIES2.push("Upload date");
    FRUITS_AND_VEGGIES2.push("Global Note");
    FRUITS_AND_VEGGIES2.push("Number of views");
    console.log(results);
    for (var prop in results) {
        if (results.hasOwnProperty(prop)) {
            FRUITS_AND_VEGGIES.push(results[prop].tag.properties.tagName);
            FRUITS_AND_VEGGIES2.push(results[prop].tag.properties.tagName);
        }
    }
    console.log(FRUITS_AND_VEGGIES);
  }
  
  function searchVeggies(searchString) {
    var results = [];
  
    for (var i = 0; i < FRUITS_AND_VEGGIES.length; i++) {
      
      var veggie = FRUITS_AND_VEGGIES[i];
      if (veggie.indexOf(searchString) === 0) {
        results.push(FRUITS_AND_VEGGIES[i]);
      }
    }
  
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
  
    return results;
  }
  
  function initializeCombobox(){
      console.log("lalala");
    var ex1Combobox = new aria.ListboxCombobox(
      document.getElementById('ex1-combobox'),
      document.getElementById('ex1-input'),
      document.getElementById('ex1-listbox'),
      searchVeggies,
      false
    );

    var ex3Combobox = new aria.ListboxCombobox(      
      document.getElementById('ex3-combobox'),
      document.getElementById('ex3-input'),
      document.getElementById('ex3-listbox'),
      searchVeggiesPlus,
      true,
      function () {
        // on show
        document.getElementById('ex3-combobox-arrow')
          .setAttribute('aria-label', 'Hide vegetable options');
      },
      function () {
        // on hide
        document.getElementById('ex3-combobox-arrow')
          .setAttribute('aria-label', 'Show vegetable options');
      }
    );
  
    document.getElementById('ex3-combobox-arrow').addEventListener(
      'click',
      function () {
        if (ex3Combobox.shown) {
          document.getElementById('ex3-input').focus();
          ex3Combobox.hideListbox();
        }
        else {
          document.getElementById('ex3-input').focus();
          console.log('hi8');
          ex3Combobox.updateResults(true);
        }
      }
    );

};