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

var results = {};
var letters = [];
for(var i = 65; i < 91; i++){
	var value = String.fromCharCode(i);
	letters.push(value);
}
var global_index = letters.length - 1;

io.on('connection', function(socket){
  
	console.log('User connected');

	socket.on('search', function(data){
		
		console.log(data);
		console.log('Called search.');

		phantom.create(function(ph) {
			
			console.log('Created Phantom object.');

			var query = data[letters[global_index]];
			console.log(query);				

			return ph.createPage(function(page){
				newPage(ph, page, query);
			});

		});		
		

		function newPage(ph, page, query) {

			console.log('Created new page.');
		    
		    return page.open("https://www.google.com/search?site=imghp&tbm=isch&q=" + query, function(status) {
		      
		      console.log("opened site? ", status);

	            setTimeout(scrape(ph, page, query), 100);
		 
		    });
	    }

		function scrape(ph, page, query){

			console.log('Started scraping...')

            return page.evaluate(

            	// Scrape
            	function() {
					var images = document.getElementsByTagName('img');
					return images[0].src

            	},

            	// Send back results
            	function(result) {
                    console.log('Found: ' + result);
                    console.log(query);
	        		while(query.indexOf(' ') > -1){
	        			query = query.replace(' ', '_') 
	        		}
                    results[query] = result;
                    var obj = {
                    	name: query,
                    	path: result
                    }
                    socket.emit('write', obj);
                    // console.log(results);

                    if(global_index > 0){
                    	
                    	global_index --;
						var newQuery = data[letters[global_index]];

						// Handling undefined queries
						while(typeof newQuery === 'undefined'){
							global_index--;
							newQuery = data[letters[global_index]];
						}
						console.log('Calling search for next: ' + newQuery);
                    	newPage(ph, page, newQuery);						

                    }else{
	                    global_index = letters.length - 1;
	                    ph.exit();
                    }
            	}
           );	
		}

	});
});