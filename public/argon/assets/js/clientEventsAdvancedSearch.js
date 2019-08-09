var socket = io.connect('http:///localhost:3000/advancedSearch')

socket.on('truc', function (message) {
    console.log(message)
})