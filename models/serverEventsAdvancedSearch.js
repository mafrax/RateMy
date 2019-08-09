var serverEventsAdvancedSearch = module.exports = function (io) {


  
    const nsp = io.of('/advancedSearch')
  
    nsp.on('connection', function (socket) {
        console.log("Welcome on the advanced Search Page user:"+ socket.handshake.session)
    }

}