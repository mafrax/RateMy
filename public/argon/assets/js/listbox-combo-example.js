/*
*   This content is licensed according to the W3C Software License at
*   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
*
* ARIA Combobox Examples
*/


var FRUITS_AND_VEGGIES = [];

  function updateVeggies(results){
    FRUITS_AND_VEGGIES = [];
    console.log(results);
    for (var prop in results) {
        if (results.hasOwnProperty(prop)) {
            FRUITS_AND_VEGGIES.push(results[prop].tag.properties.tagName);
        }
    }
    console.log(FRUITS_AND_VEGGIES);
  }
  
  function searchVeggies(searchString) {
    var results = [];
  
    for (var i = 0; i < FRUITS_AND_VEGGIES.length; i++) {
      var veggie = FRUITS_AND_VEGGIES[i].toLowerCase();
      if (veggie.indexOf(searchString.toLowerCase()) === 0) {
        results.push(FRUITS_AND_VEGGIES[i]);
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
};