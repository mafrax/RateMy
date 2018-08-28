var socket = io.connect('http://localhost:3000');

            socket.on('message', function(message) {
                $('#modal-body').html(message);
            })



                $('#uploadForm').submit(function () {
                    
                    var url1 = $('#field2').val();
                   
                    socket.emit('message', url1);                           

                   return false; // Permet de bloquer l'envoi "classique" du formulaire . En fait, return false est équivalent à la fonction de jQuery preventDefault()
                });
                


