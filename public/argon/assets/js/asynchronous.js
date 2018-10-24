function asynchronous(urlOrigin){

    // console.log(/*)(document.getElementById("field2"));
    // console.log(/*)(urlOrigin);
    var url = '/upload/'+urlOrigin;
    // console.log(/*)(url);
    var xmlHttp = new XMLHttpRequest();
    
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState === 4) {
            document.getElementById("truc").innerHTML = xhttp.responseText;
        }
    }
    xmlHttp.open("POST", url, true); // false for synchronous request
    xmlHttp.send(null);
}
