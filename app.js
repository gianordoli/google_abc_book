var express = require('express');
var app     = express();

app.use(function(req, res, next) {
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	console.log('incoming request from ---> ' + ip);
	var url = req.originalUrl;
	console.log('### requesting ---> ' + url);
	next();
});

app.use('/', express.static(__dirname + '/public'));

var server = app.listen(3011, function(){
	console.log('Listening on 3011');
});
var io		= require('socket.io').listen(server);

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