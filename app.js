var express = require('express');
var app     = express();
var http	= require('http').Server(app);
var io		= require('socket.io')(http);

app.use(express.static(__dirname + '/public'));
http.listen(9001, function(){
  console.log('listening on *:9001');
});

io.on('connection', function(socket){
  
	console.log('User connected');

	socket.on('search', function(query){

		console.log('Called search.')

		var phantom = require('phantom');
		phantom.create(function(ph) {
			return ph.createPage(function(page) {
			    return page.open("https://www.google.com/search?site=imghp&tbm=isch&q="+query, function(status) {
			      console.log("opened site? ", status);         
			 		
			 		// var $ = cheerio.load(this);

		            setTimeout(function() {
		                return page.evaluate(function() {

							var images = document.getElementsByTagName('img');
							return images[0].src;

		                }, function(result) {
		                    console.log(result);
		                    socket.emit('write', result);
		                    ph.exit();
		                });
		            }, 1000);
			 
			    });
		    });
		});

	});
});