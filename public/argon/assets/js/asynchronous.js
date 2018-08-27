function asynchronous(){

    console.log(document.getElementById("field2"));
    var url = '/truc/'+document.getElementById("field2").nodeValue;
    var xmlHttp = new XMLHttpRequest();
    
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState === 4) {
            // here get the response from the server
            // and display your data
        }
    }
    xmlHttp.open("POST", url, true); // false for synchronous request
    xmlHttp.send(null);
}
