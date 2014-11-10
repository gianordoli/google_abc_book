/*-------------------- MODULES --------------------*/

var express = require('express');
var app     = express();
var phantom = require('phantom');
var server = app.listen(3011, function(){
	console.log('Listening on 3011');
});
var io		= require('socket.io').listen(server);


/*-------------------- SETUP --------------------*/

app.use(function(req, res, next) {
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	console.log('incoming request from ---> ' + ip);
	var url = req.originalUrl;
	console.log('### requesting ---> ' + url);
	next();
});

app.use('/', express.static(__dirname + '/public'));


/*------------------ SCRAPING --------------------*/

io.on('connection', function(socket){
  
	console.log('User connected');

	socket.on('search', function(query){

		console.log('Called search.');
		
		phantom.create(function(ph) {
			
			console.log('Created Phantom object.');

			return ph.createPage(function(page) {

				console.log('Created page.');
			    
			    return page.open("https://www.google.com/search?site=imghp&tbm=isch&q="+query, function(status) {
			      
			      console.log("opened site? ", status);

		            setTimeout(function() {

		                return page.evaluate(function() {

							var images = document.getElementsByTagName('img');

							return images[0].src

		                }, function(result) {
		                    console.log(result);
		                    console.log(query);
			        		while(query.indexOf(' ') > -1){
			        			query = query.replace(' ', '_') 
			        		}
		                    var obj = {
		                    	name: query,
		                    	path: result
		                    }
		                    socket.emit('write', obj);
		                    ph.exit();
		                });
		            }, 500);
			 
			    });
		    });
		});

	});
});