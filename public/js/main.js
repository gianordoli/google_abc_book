var socket = io();

$(document).ready(function () {

	console.log('Called server.');

	/*-------------------- ARRAYS --------------------*/
	var labels = ['web', 'youtube', 'recipes', 'products', 'news', 'images', 'books'];

	var services = {
	youtube: { name: 'Youtube', client: 'youtube', ds: 'yt', address: 'https://www.youtube.com/results?search_query=X' },
	books: { name: 'Google Books', client: 'books', ds: 'bo', address: 'https://www.google.com/search?q=X&tbm=bks' },
	products: { name: 'Google Products', client: 'products-cc', ds: 'sh', address: 'https://www.google.com/#q=X&tbm=shop' },
	news: { name: 'Google News', client: 'news-cc', ds: 'n', address: 'https://www.google.com/#q=X&tbm=nws' },
	images: { name: 'Google Images', client: 'img', ds: 'i', address: 'https://www.google.com/search?site=imghp&tbm=isch&q=X' },
	web: { name: 'Google', client: 'psy', ds: '', address: 'https://www.google.com/#q=X' },
	recipes: { name: 'Google Recipes', client: 'psy', ds: 'r', address: 'https://www.google.com/search?q=X&tbs=rcp'  }
	};

	var results = {};
	results.size = 0;
	var letters = [];
	for(var i = 65; i < 91; i++){
		var value = String.fromCharCode(i);
		letters.push(value);
	}

	/*-------------------- ELEMENTS --------------------*/
    $.each(labels, function(i, v){
    	var checked = (i == 0)?('checked'):('');
    	var radio = $('<input type="radio" name="service" value="' + v + '" '+ checked + '>').appendTo('#service-list');
    	var span = $('<span>' + v + '</span>').appendTo('#service-list');
    });

	var opts = $.extend({service: 'web', secure: false}, opts);
	var service = services[$('input[name="service"]').val()];


	/*-------------------- LISTENERS --------------------*/

	// RADIO
    // Attribute Google Search service when radio button is selected
    $('input[name="service"]').click(function(){
		service = services[$(this).val()];
		console.log(service);
    });

    // SEARCH BUTTON
    // Loop through alphabet, getting first suggestion for each letter
	$('#search-button').bind('mouseup', function(event){
		// Reset results
		results = {};
		results.size = 0;
		
		// Call autocomplte for each letter
		$.each(letters, function(i, v){
			getAutocomplete(v);
		});
	});

	// COLORS
	$('#fg-color').change(function(){
		var foregroundColor = parseHslaColor($('#fg-color').val(), 50, 50, 1);
		$('.tile').css({
			'color': foregroundColor
		});
		$('.box').css({
			'border-color': foregroundColor
		});		
	});
	$('#bg-color').change(function(){
		var backgroundColor = parseHslaColor($('#bg-color').val(), 50, 50, 1);
		$('.tile.alphabet').css({
			'background-color': backgroundColor
		});
		$('.tile.cover p, .tile.cover h2').css({
			'color': backgroundColor
		});
	});	

	// SOCKET (receives images addresses)
	socket.on('write', function(data) {
		console.log(data);
		var div = $('#' + data.name);
		$(div).css({
			'background-image': 'url(' + data.path + ')'
		});
	});	


	/*-------------------- LISTENERS --------------------*/

	function getAutocomplete(letter){
		
		console.log('Called getAutocomplete');

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
			
			// console.log('success');
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

      			// console.log(results);
				createDivs();	
      			scrapeImages();
      		}
	      },
	      error: function(){
	      	console.log('error');
	      }
	    });
	}

	function createDivs(){
		
		// Clean up the 'book,' removing all divs previously generated
		$('#book').empty();

		for(var i = 0; i < letters.length; i++){

			var v = results[letters[i]];	// Div id

			// Might be the case that no autocomplete suggestion was stored
			// If so, use the letter (A, B, C...) as id
			if(typeof v === 'undefined'){
				v = letters[i];
	    	}else{
				// We can't use spaces in ids, so replace it with underscores
	    		while(v.indexOf(' ') > -1){
	    			v = v.replace(' ', '_');
	    		}    			
    		}
			// console.log(v);

			// DIV
			var div = $('<div id=' + v + ' class="tile alphabet">').appendTo('#book');

			// LETTER
			$(div).html(letters[i]);

			// index will run through the array backwards
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
				// console.log('Generating cover...');
				var div = $('<div id="front" class="tile cover">').appendTo('#book');
				$(div).cover('front');
				$(div).css({
						'left': posLeft - $(div).width(),
						'top': posTop							
				});

				// console.log('Generating back...');
				var div = $('<div id="back" class="tile cover">').appendTo('#book');
				$(div).cover('back');
				$(div).css({
						'left': posLeft - 14 - (2 * $(div).width()),
						'top': posTop							
				});						
			}
		}
	}	


	jQuery.fn.cover = function(side) {
	    
	    var box = $('<div class="box">').appendTo(this);

	    if(side == 'front'){
	    	$(box).append('<h2>The ' + service.name + '</h2>');
	    	$(box).append('<h1>ABC</h1>');
	    	$(box).append('<h2>Book</h2>');
	    }else{
	    	var today = new Date();

	    	var dd = today.getDate();
	    	var mm = today.getMonth() + 1;
	    	var yyyy = today.getFullYear();

	    	var date = mm + '/' + dd + '/' + yyyy;
			var time = today.getHours() + ':' + today.getMinutes();

			$(box).append('<p>Earlier and earlier kids are learning things online. So why not start as soon as possible? This ABC book curated by Google Images brings to your children the top searches for each letter! Kids will love it!</p>');
			$(box).append('<h3>' + time + ' edition, ' + date + '</h3>');
			$(box).append('<p>More at gianordoli.com/abc</p>');
	    }
	    return $(this);
	};


	function scrapeImages(){
		for(var i = 0; i < letters.length; i++){

			var v = results[letters[i]];
			console.log(v);

			// Only if there were autocomplete suggestions
			if(typeof v !== 'undefined'){
				console.log('Called search for ' + v);
				socket.emit('search', v);
			}
		}		
	}


	var parseHslaColor = function(h, s, l, a){
		var myHslColor = 'hsla(' + h + ', ' + s + '%, ' + l + '%, ' + a +')';
		//console.log('called calculateAngle function');
		return myHslColor;
	}	
 
});