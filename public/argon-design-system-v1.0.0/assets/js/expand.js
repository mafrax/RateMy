function expandIframe(column, row){

var cell = document.getElementById("cell"+row+"x"+column);

if(cell.getAttribute("class") === "col-sm-4" ){
    cell.setAttribute("class", "col-sm-8" );
} else if (cell.getAttribute("class") === "col-sm-8"){
    cell.setAttribute("class", "col-sm-4" );
} else {
    console.log("cell not found");
}
}