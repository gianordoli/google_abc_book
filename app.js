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
var i = 0;

io.on('connection', function(socket){
  
	console.log('User connected');

	socket.on('search', function(data){
		
		console.log(data);
		console.log('Called search.');

		phantom.create(function(ph) {
			
			console.log('Created Phantom object.');

			var query = data[letters[i]];
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
                    // console.log(results);

                    if(i < letters.length - 1){
                    	i++;
						var newQuery = data[letters[i]];
						console.log('Calling search for next: ' + newQuery);	                    	
                    	newPage(ph, page, newQuery)
                    }else{
	                    socket.emit('write', results);
	                    ph.exit();                    	
                    }
            	}
           );	
		}

		// var query = obj.v;
		// var index = obj.i;

		// console.log('Called search.');
		
		// phantom.create(function(ph) {
			
		// 	console.log('Created Phantom object.');

		// 	return ph.createPage(function(page) {

		// 		console.log('Created page.');
			    
		// 	    return page.open("https://www.google.com/search?site=imghp&tbm=isch&q="+query, function(status) {
			      
		// 	      console.log("opened site? ", status);

		//             setTimeout(function() {

		//                 return page.evaluate(function() {

		// 					var images = document.getElementsByTagName('img');

		// 					return images[0].src

		//                 }, function(result) {
		//                     console.log(result);
		//                     console.log(query);
		// 	        		while(query.indexOf(' ') > -1){
		// 	        			query = query.replace(' ', '_') 
		// 	        		}
		//                     var obj = {
		//                     	i: index,
		//                     	name: query,
		//                     	path: result
		//                     }
		//                     socket.emit('write', obj);
		//                     ph.exit();
		//                 });
		//             }, 100);
			 
		// 	    });
		//     });
		// });

	});
});