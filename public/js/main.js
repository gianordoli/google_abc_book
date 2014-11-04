var socket = io();

$(document).ready(function () {

	console.log('Called server.');

	/*-------------------- ARRAYS --------------------*/
	var labels = ['web', 'youtube', 'recipes', 'products', 'news', 'images', 'books'];

	var services = {
	youtube: { client: 'youtube', ds: 'yt', address: 'https://www.youtube.com/results?search_query=X' },
	books: { client: 'books', ds: 'bo', address: 'https://www.google.com/search?q=X&tbm=bks' },
	products: { client: 'products-cc', ds: 'sh', address: 'https://www.google.com/#q=X&tbm=shop' },
	news: { client: 'news-cc', ds: 'n', address: 'https://www.google.com/#q=X&tbm=nws' },
	images: { client: 'img', ds: 'i', address: 'https://www.google.com/search?site=imghp&tbm=isch&q=X' },
	web: { client: 'psy', ds: '', address: 'https://www.google.com/#q=X' },
	recipes: { client: 'psy', ds: 'r', address: 'https://www.google.com/search?q=X&tbs=rcp'  }
	};

	var results = {};
	results.size = 0;
	var letters = [];
	for(var i = 65; i < 91; i++){
		var value = String.fromCharCode(i);
		letters.push(value);
	}
	console.log(letters);

	/*-------------------- ELEMENTS --------------------*/
    $.each(labels, function(i, v){
    	var checked = (i == 0)?('checked'):('');
    	var radio = $('<input type="radio" name="service" value="' + v + '" '+ checked + '>').appendTo('#service-list');
    	var span = $('<span>' + v + '</span>').appendTo('#service-list');
    });

	var opts = $.extend({service: 'web', secure: false}, opts);
	var service = services[$('input[name="service"]').val()];


	/*-------------------- LISTENERS --------------------*/

    // Attribute Google Search service when radio button is selected
    $('input[name="service"]').click(function(){
		service = services[$(this).val()];
		// console.log($(this).val());
    });

    // Loop through alphabet, getting first suggestion for each letter
	$('#search-button').bind('mouseup', function(event){
		$.each(letters, function(i, v){
			getAutocomplete(v);
		});
	});

	function getAutocomplete(letter){
	    $.ajax({
	      url: 'http'+(opts.secure?'s':'')+'://clients1.google.com/complete/search',
	      dataType: 'jsonp',
	      data: {
	        q: letter,
	        nolabels: 't',
	        client: service.client,
	        ds: service.ds
	      },
	      success: function(data) {

	      	// console.log(data);

	      	// Options come with tags; clean up to get text only
	      	var options = $.map(data[1], function(item){
	          return $("<span>").html(item[0]).text();
	        });

	        // console.log(options.length);
	        // console.log(options);
	        console.log(options[0]);
	        var value = options[0];	// Take only the first suggestion
      		results[letter] = value;	// Store in associative array
      		results.size ++;
      										
      		// If it's the last one:
      		if(results.size == 26){

      			console.log(results);

      			// Create divs
      			for(var i = 0; i < letters.length; i++){

      				var v = results[letters[i]];

      				// Replace spaces with underscores
      				if(typeof v !== 'undefined'){
		        		while(v.indexOf(' ') > -1){
		        			v = v.replace(' ', '_');
		        		}
		        	}
		        	else{
		        		v = letters[i];
		        	}
      				console.log(v);

      				var div = $('<div id=' + v + ' class="tile">').appendTo('#book');
      				$(div).html(letters[i]);

      				var index = (results.size - 1) - i;

      				var nColumns = 4;
      				var posTop = Math.floor(index / nColumns) * $(div).height();
      				var posLeft;
      				if(Math.floor(index / nColumns) % 2 == 0){
						posLeft = (nColumns - 1 - (index % nColumns)) * $(div).width();					
      				}else{
						posLeft = (index % nColumns) * $(div).width();
					    $(div).css({'-webkit-transform' : 'rotate('+ 180 +'deg)',
					                 '-moz-transform' : 'rotate('+ 180 +'deg)',
					                 '-ms-transform' : 'rotate('+ 180 +'deg)',
					                 'transform' : 'rotate('+ 180 +'deg)'});
      				}

      				div.css({
      					'left': posLeft,
      					'top': posTop
      				});

      				// After the first element, create cover and back
      				if(i == 0){
      					console.log('Generating cover...');
						var div = $('<div id="Front" class="tile cover">').appendTo('#book');
						$(div).cover('front');
						$(div).css({
	      					'left': posLeft - $(div).width(),
	      					'top': posTop							
						});

      					console.log('Generating back...');
						var div = $('<div id="back" class="tile cover">').appendTo('#book');
						$(div).cover('back');
						$(div).css({
	      					'left': posLeft - 14 - (2 * $(div).width()),
	      					'top': posTop							
						});						
      				}
      			}
      			
      			// Go grab the images / call the scraper...
      			for(var i = 0; i < letters.length; i++){

      				var v = results[letters[i]];

      				// Only if there were autocomplete suggestions
      				if(typeof v !== 'undefined'){
      					socket.emit('search', v);
      				}
				}
      		}
	      },
	      error: function(){
	      	console.log('error');
	      }
	    });
	}

	jQuery.fn.cover = function(side) {
	    var box = $('<div class="box">').appendTo(this);
	    if(side == 'front'){
	    	$(box).append('<p class="header2">The Google Images</p>');
	    	$(box).append('<p class="header1">ABC</p>');
	    	$(box).append('<p class="header2">Book</p>');
	    }else{
			$(box).append('<p>Earlier and earlier kids are learning things online. So why not start as soon as possible? This ABC book curated by Google Images brings to your children the top searches for each letter! Kids will love it!</p>');
			$(box).append('<p class="header3">5-7pm 10/21/2014 edition</p>');
			$(box).append('<p>More at gianordoli.com/abc</p>');
	    }
	    return $(this);
	};

	// Appending the images
	socket.on('write', function(data) {
		console.log(data);
		var div = $('#' + data.name);
		$(div).css({
			'background-image': 'url(' + data.path + ')'
		});
	});	
 
});