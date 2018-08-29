var socket = io.connect('http://localhost:3000');

            socket.on('messageUploadfromServer', function(message) {
                console.log(document.getElementById("hiddenURl"));
                console.log(message.originalUrlField);
                $('#modal-body').html(message.htmlfield);
                $('#exampleModalLabel').html(message.titlefield);
            })



                $('#uploadForm').submit(function () {
                    
                    var url1 = $('#field2').val();
                    socket.emit('messageUploadfromClient', url1);                           

                   return false; // Permet de bloquer l'envoi "classique" du formulaire . En fait, return false est équivalent à la fonction de jQuery preventDefault()
                });
                

                $('#modalSaveButton').click(function () {
                    
                    var title = $('#exampleModalLabel').val();
                    var originalUrl = $('#hiddenURl').val();
                    var embedUrl = $('#modalEmbedVideoId').val();
                    console.log(title);
                    console.log(originalUrl);
                    console.log(embedUrl);
                    socket.emit('messageSavefromClient', {titlefield: title , originalUrlField: originalUrl, embedUrlField : embedUrl });                           

                   return false; // Permet de bloquer l'envoi "classique" du formulaire . En fait, return false est équivalent à la fonction de jQuery preventDefault()
                });


