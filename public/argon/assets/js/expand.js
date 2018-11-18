function expandIframe(id){
var cell = document.getElementById("cell"+id);
// console.log(cell);
var cell2;

$("#expandButton"+id).tooltip('hide');

if(cell.getAttribute("class") === "col-4 flex-wrap" ){
    cell.setAttribute("class", "col-8 flex-wrap" );
} else if (cell.getAttribute("class") === "col-8 flex-wrap"){
    cell.setAttribute("class", "col-4 flex-wrap" );
} else {
    // console.log("cell not found");
}


}