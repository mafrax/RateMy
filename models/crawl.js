var rp = require('request-promise');
var request = require('request');
var cheerio = require('cheerio');

// private constructor:
var Crawler = module.exports = function Crawler(_node) {
    // all we'll really store is the node; the rest of our properties will be
    // derivable or just pass-through properties (see below).
    this._node = _node;
}

Crawler.crawl = function (url, cb) {

    if(url.includes("?")){
        var parts = url.split("?");
        console.log(parts[0]);
        var qsArray = parts[1].split("=");
        var vK = qsArray[0];
        var vkValue = qsArray[1];
        var truc = vK.valueOf();

        
        
        
        console.log(truc);
        
        var options = {
            uri: parts[0],
            qs: {
                // promo : vkValue // -> uri + '?access_token=xxxxx%20xxxxx'
            },
            headers: {
                'User-Agent': 'Request-Promise'
            },
            json: true // Automatically parses the JSON string in the response
        };

        console.log(options.qs);
    options.qs[vK.valueOf()] = vkValue;

    } else {
        var options = {
            uri: url,
            headers: {
                'User-Agent': 'Request-Promise'
            },
            json: true // Automatically parses the JSON string in the response
        };
    }
        
    
    console.log(options);
    rp(options)
        .then(function (response) {
            try {
                var n = response.indexOf("/embed/");
                var res2 = response.substring(n - 50, n + 100);
                console.log(res2);
                var sub = res2.search('="http');
                console.log(sub);
                var sub2 = res2.indexOf('"', sub+6);
                console.log(sub2);
                var res3 = res2.substring(sub + 2, sub2);
                console.log(res3);

                cb(res3);

            } catch (e) {
                reject(e);
            }
        })
        .catch(function (err) {
            console.log(err);
            // rejected
        });

}

Crawler.addModalDiv = function (url) {

    var html2 = '<div class="col-12" id="cell0x0" >'+
      '<!-- <div class="pl-4" style="border: rgb(19, 161, 243); border-width: 2px; border-style: ridge; padding: 3px; border-radius: 0.9vh; background-color: rgb(175, 213, 238);"> -->'+
      '<div class="row col-12 embed-responsive embed-responsive-16by9">'+
        '<iframe class="embed-responsive-item" src="'+url+'" frameborder="0" allow="autoplay; encrypted-media"'+
          'allowfullscreen>'+
        '</iframe>'+
        '<button type="button" value="Edit" class="col-2 btn btn-sm btn-primary " style="border-radius: 100vh;" onclick="expandIframe(0,0)">EX</button>'+
      '</div>'+

      '<div class="row col-12 " style="border: rgb(19, 161, 243); border-width: 2px; border-style: ridge; padding: 3px; border-radius: 0.9vh; background-color: rgb(175, 213, 238);">'+
        '<!-- <button class="row col-12 btn btn-sm btn-primary" data-toggle="collapse" data-target="#demo"> -->'+
        '<!-- </button> -->'+
        '<div class="row col-12 flex">'+

          '<button class="col-2 btn btn-sm btn-primary" type="button" data-toggle="collapse" data-target="#demo" aria-controls="nav-inner-primary"'+
            'aria-expanded="false" aria-label="Toggle navigation" style="margin-left: 20px;">'+
            '<span class="navbar-toggler-icon">V</span>'+
          '</button>'+
          '<input class="col-6 form-control" placeholder="Search" type="text" style="width: 80%;">'+
          '<button type="button" value="Edit" class="col-2 btn btn-sm btn-primary " style="border-radius: 100vh;">S</button>'+
        '</div>'+

        '<div id="demo" class="collapse flex" style="max-height: 50vh; overflow:auto">'+
          '<div class="container-fluid justify-content-center" style="float: left;" id="progressBarContainer0">'+

            '<div class="criterion flex" id="progressBar0"  style="position: relative;">'+
            '<div class="progress-wrapper ">'+
              '<div class=" progress-info ">'+
                '<div class="progress-label ">'+
                  '<span id="criterionName0">Task completed !!!!!!!!!!!!!!!!!!!!'+
                  '</span>'+
                  '<input type="hidden" id="custId0">'+
                '</div>'+
                '<button type="button" id="edit_button0" value="Edit" class="btn btn-sm btn-primary " onclick="edit_row(0)" style="border-radius: 100vh">E</button>'+
                '<button type="button" id="save_button0" value="Save" class="btn btn-sm btn-primary " onclick="save_row(0)" style="border-radius: 100vh">S</button>'+

                '<div class="progress-percentage" style="display: flex" >'+
                  '<span style="color:rgba(248, 9, 176, 0.575)">40%</span>'+
                '</div>'+
              '</div>'+

              '<div class="progress"  style="position: relative;">'+
                '<div class="progress-bar" role="progressbar" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100" style="width: 25%; background-color: rgba(248, 9, 176, 0.575);"></div>'+
              '</div>'+
            '</div>'+


            '<div class="input-slider-container"  style="position: relative;">'+
              '<div id="input-slider1" class="input-slider" data-range-value-min="100" data-range-value-max="500"></div>'+
              '<!-- Input slider values -->'+
              '<div class="row mt-3 d-none">'+
                '<div class="col-6">'+
                  '<span id="input-slider-value1" class="range-slider-value" data-range-value-low="100"></span>'+
                '</div>'+
              '</div>'+
            '</div>'+

            '</div>'+

          '</div>'+

          '<input type="button" class="btn btn-sm btn-primary" onclick="add_criterion(0)" value="Add" >'+
          '<input type="submit" class="btn btn-sm btn-primary" formaction="/user/save">'+
        '</div>'+
      '</div>'+
    '</div>';


return html2;

    // var new_element = document.createElement("div");
    //     new_element.setAttribute('class', "modal fade");
    //     new_element.setAttribute('id', 'exampleModal');
    //     new_element.setAttribute('tabindex', '-1');
    //     new_element.setAttribute('role', 'dialog');
    //     new_element.setAttribute('aria-labelledby', 'exampleModalLabel');
    //     new_element.setAttribute('aria-hidden', 'hidden');

    //     new_element.innerHTML = html2;
    //     console.log(new_element);
    //     max_div.appendChild(new_element);

}