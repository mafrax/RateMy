const csv = require('csv-parser')
const fs = require('fs')
const results = [];


const csvFilePath='Classeur4.csv'
const csv2=require('csvtojson');
// var converter = new Converter({});

// private constructor:
var csvDownloader = (module.exports = function csvDownloader(_node) {
    // all we'll really store is the node; the rest of our properties will be
    // derivable or just pass-through properties (see below).
    this._node = _node;
  });


  csvDownloader.readCSV = function() {

    // var readOptions = { 'flags': 'r', 'encoding': 'utf-8' , 'mode': 0666  , 'bufferSize': 4 * 1024 };


    // // fs.createReadStream("./Classeur2.csv", readOptions)
    // fs.createReadStream("./Classeur3.csv")
    // .pipe(csv({ separator: '\,' }))
    // .on('data', results.push)
    // .on('end', () => {
    //   // // console.log(results);
    //   // [
    //   //   { NAME: 'Daffy Duck', AGE: 24 },
    //   //   { NAME: 'Bugs Bunny', AGE: 22 }
    //   // ]
    //     });

    // const converter=csv2({
    //     noheader:true,
    //     trim:true,
    //     delimiter: ","
    // })

    //     csv2({
    //         trim:true,
    //         noheader: false,
    //         delimiter: "---"
    //     })
    //     .fromFile(csvFilePath)
    //     .then((jsonObj)=>{
    //         // // console.log(jsonObj);
    //         /**
    //          * [
    //          * 	{a:"1", b:"2", c:"3"},
    //          * 	{a:"4", b:"5". c:"6"}
    //          * ]
    //          */ 
    //     })

    // var Converter = require("csvtojson").Converter;
    // // create a new converter object
    // var converter = new Converter({});

    //     converter.fromFile(csvFilePath,function(err,result){
    //         // if an error has occured then handle it
    //         if(err){
    //             // // console.log("An Error Has Occured");
    //             // // console.log(err);  
    //         } 
    //         // create a variable called json and store
    //         // the result of the conversion
    //         var json = result;
            
    //         // log our json to verify it has worked
    //         // // console.log(json);
    //     });


    csv2().fromFile('test.csv').on("json",function(jsonArrayObj){ 
        // // console.log(jsonArrayObj); 
      })


}