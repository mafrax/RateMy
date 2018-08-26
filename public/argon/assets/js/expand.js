function expandIframe(column, row){
console.log("cell"+row+"x"+column);
var cell = document.getElementById("cell"+row+"x"+column);
console.log(cell);
var cell2;


if(cell.getAttribute("class") === "col-sm-4 align-self-start" ){
    cell.setAttribute("class", "col-sm-8 align-self-start" );
} else if (cell.getAttribute("class") === "col-sm-8 align-self-start"){
    cell.setAttribute("class", "col-sm-4 align-self-start" );
} else {
    console.log("cell not found");
}


}