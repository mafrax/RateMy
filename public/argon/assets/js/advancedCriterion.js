function moveTosearchBlock(tag, block){

    console.log("truc")
    console.log(tag)
    console.log(Object.keys(tag))
    if(!block){
        block = document.querySelector("#defaultBlock");
    }
console.log(block)
   var ol = block.querySelector(".defaultCriterionContainer")
console.log(ol)
    var newCriterion = document.createElement("li");
    newCriterion.setAttribute("style", "color: aliceblue")
    newCriterion.innerHTML = tag


    ol.appendChild(newCriterion);

}