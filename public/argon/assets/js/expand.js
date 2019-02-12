function expandIframe(id){
var cell = document.getElementById("cell"+id);
// console.log(cell);
var cell2;

$("#expandButton"+id).tooltip('hide');

if(cell.getAttribute("class") === "col-12 col-md-4 flex-wrap" ){
    cell.setAttribute("class", "col-12 col-md-8 flex-wrap" );
} else if (cell.getAttribute("class") === "col-12 col-md-8 flex-wrap"){
    cell.setAttribute("class", "col-12 col-md-4 flex-wrap" );
} else {
    // console.log("cell not found");
}


}