function expandIframe(column, row){
console.log("cell"+row+"x"+column);
var cell = document.getElementById("cell"+row+"x"+column);
console.log(cell);
var cell2;


if(cell.getAttribute("class") === "col-sm-4 flex" ){
    cell.setAttribute("class", "col-sm-8 flex" );
} else if (cell.getAttribute("class") === "col-sm-8 flex"){
    cell.setAttribute("class", "col-sm-4 flex" );
} else {
    console.log("cell not found");
}


}