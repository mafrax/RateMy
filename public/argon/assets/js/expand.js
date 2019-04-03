function expandIframe(id){
var cell = document.getElementById("cell"+id);
// // console.log(cell);
var cell2;

$("#expandButton"+id).tooltip('hide');

if(cell.getAttribute("class") === "col-12 col-md-4 flex-wrap" ){
    cell.setAttribute("class", "col-12 col-md-8 flex-wrap" );
} else if (cell.getAttribute("class") === "col-12 col-md-8 flex-wrap"){
    cell.setAttribute("class", "col-12 col-md-4 flex-wrap" );
} else {
    // // console.log("cell not found");
}


}


function thumbToVideo(id){
    var button = document.getElementById("thbnB"+id);
  
    
    if(button.firstChild.getAttribute("class") === "ni ni-button-play" ){
        button.firstChild.setAttribute("class", "ni ni-image" );
    } else if (button.firstChild.getAttribute("class") === "ni ni-image"){
        button.firstChild.setAttribute("class", "ni ni-button-play" );
    } else {
        // // console.log("cell not found");
    }
    
    
}
