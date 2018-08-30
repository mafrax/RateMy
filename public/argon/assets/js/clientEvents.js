var socket = io.connect('http://localhost:3000');

            socket.on('messageUploadfromServer', function(message) {
                console.log(message.originalUrlField);
                $('#modal-body').html(message.htmlfield);
                $('#exampleModalLabel').html(message.titlefield);
                console.log(message);
                console.log(message.tags);
                message.tags.each( function(element){
                    add_criterion(0 , element);
                })
            })

            socket.on('videoSavedfromServer', function() {
                
                $('#closeModalButton').trigger('click');
               
            })



                $('#uploadForm').submit(function () {
                    
                    var url1 = $('#field2').val();
                    socket.emit('messageUploadfromClient', url1);                           

                   return false; // Permet de bloquer l'envoi "classique" du formulaire . En fait, return false est équivalent à la fonction de jQuery preventDefault()
                });
                

                $('#modalSaveButton').click(function () {
                    
                    var title = $('#exampleModalLabel').html();
                    var originalUrl = $('#hiddenURl').val();
                    var embedUrl = $('#modalEmbedVideoId').attr('src');
                    console.log(title);
                    console.log(originalUrl);
                    console.log(embedUrl);
                    socket.emit('messageSavefromClient', {titlefield: title , originalUrlField: originalUrl, embedUrlField : embedUrl });                           

                   return false; // Permet de bloquer l'envoi "classique" du formulaire . En fait, return false est équivalent à la fonction de jQuery preventDefault()
                });


