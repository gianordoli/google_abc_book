var socket = io();

$(document).ready(function () {

	// Hide sections
	var sections = $('section');
	for(var i = 1; i < sections.length; i++){
		$(sections[i]).css('display', 'none');
	}

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
		
		// Call autocomplte for each letter
		$.each(letters, function(i, v){
			getAutocomplete(v);
		});
	});

	// COLORS
	// $('#fg-color').change(function(){
	// 	var foregroundColor = parseHslaColor($('#fg-color').val(), 50, 50, 1);
	// 	$('.box').css({
	// 		'border-color': foregroundColor
	// 	});
	// 	$('.tile.alphabet, .tile h1, .tile h3').css({
	// 		'color': foregroundColor,
	// 	   // '-webkit-text-fill-color': foregroundColor
	// 	});		
	// });
	// $('#bg-color').change(function(){
	// 	var backgroundColor = parseHslaColor($('#bg-color').val(), 50, 50, 1);
	// 	// $('.tile.alphabet').css({
	// 		// 'background-color': backgroundColor
	// 	   // '-webkit-text-stroke-color': backgroundColor
	// 	// });
	// 	$('.tile.cover p, .tile.cover h2').css({
	// 		'color': backgroundColor
	// 	});
	// });	

	// SOCKET (receives images addresses)
	socket.on('write', function(data) {
		console.log(data);
		for(var key in data){

			var div = $('#' + key + '_img');
			$(div).html('');

			var img = $('<img src=' + data[key] +' class="scraped-img">').appendTo(div);
			// console.log($(myImg).width());
			$(img).css({
				'top': ($(div).height() - $(img).height())/2,
				'left': ($(div).width() - $(img).width())/2
			});
		}
	});	

	$('#print-button').bind('mouseup', function(event){
		printElement('#book');
	});

    function printElement(elem){
    	// console.log(elem);
        popUp($(elem).html());
    }

    function popUp(data){
    	// console.log(data);

        var mywindow = window.open('', 'my div', 'height=400,width=600');
        mywindow.document.write('<html><head>');
        mywindow.document.write('<link rel="stylesheet" href="css/style.css" type="text/css" />');
        mywindow.document.write('</head><body >');
        mywindow.document.write(data);
        mywindow.document.write('<script>window.print()</script>');
        mywindow.document.write('</body></html>');

        // mywindow.print();
        // mywindow.close();

        // return true;
    }

	/*-------------------- FUNCTIONS --------------------*/

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
			
			console.log('success');
	      	// console.log(data);

	      	// Options come with tags; clean up to get text only
	      	var options = $.map(data[1], function(item){
	          return $("<span>").html(item[0]).text();
	        });

	        // console.log(options.length);
	        // console.log(options);
	        // console.log(options[0]);

	        var value = options[0];	// Take only the first suggestion
      		results[letter] = value;	// Store in associative array
      										
      		// If it's the last one:
      		if(Object.size(results) == letters.length){

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
		var nColumns = 4;
		var nLines = 7;
		var coverOffset = 14;
		var div;

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
			div = $('<div id="' + v + '_letter" class="tile alphabet">').appendTo('#book');

			// LETTER
			$(div).html(letters[i]);

			// index will run through the array backwards
			var index = (Object.size(results) - 1) - i;

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
				'left': coverOffset + posLeft,
				'top': posTop,
				'z-index': i + 100
			});

			//Duplicate div and create divs for images
			var divImg = $(div).clone().appendTo('#book');
			$(divImg).html('');
			$(divImg).attr('id', v + '_img');
			$(divImg).css('z-index', $(div).css('z-index') - 100);
			$('<img src="img/loading.gif" />').appendTo(divImg);

			// After the first element, create cover and back
			if(i == 0){
				// console.log('Generating cover...');
				div = $('<div id="front" class="tile cover">').appendTo('#book');
				$(div).cover('front');
				$(div).css({
						'left': posLeft - $(div).width(),
						'top': posTop							
				});

				// console.log('Generating back...');
				div = $('<div id="back" class="tile cover">').appendTo('#book');
				$(div).cover('back');
				$(div).css({
						'left': posLeft - (2 * $(div).width()),
						'top': posTop		
				});						
			}
		}

		// Resize the book
		$('#book').css({
			'width': coverOffset + (nColumns * $(div).width()),
			'height': nLines * $(div).height()
		});

		//Display following instructions
		$.each($('section'), function(i, v){
			$(v).css('display', 'inline');
		});		
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
	    	var min = today.getMinutes();
	    	if(min < 10){
	    		min = 0 + min;
	    	}
			var time = today.getHours() + ':' + min;

			$(box).append('<p>Earlier and earlier kids are learning things online. So why not start as soon as possible? This ABC book curated by Google Images brings to your children the top searches for each letter! Kids will love it!</p>');
			$(box).append('<h3>' + time + ' edition, ' + date + '</h3>');
			$(box).append('<p>More at gianordoli.com/abc</p>');
	    }
	    return $(this);
	};


	function scrapeImages(){
		socket.emit('search', results);
		// $.each(results, function(i, v){
		// 	console.log(v);
		// });
		// var obj = {
		// 	i: index,
		// 	v: results[letters[index]]
		// }

		// // Only if there were autocomplete suggestions
		// if(typeof obj.v !== 'undefined'){
		// 	console.log('Called search for ' + obj.v);
		// 	socket.emit('search', obj);
		// }else if(index > 0){
		// 	index--;
		// 	scrapeImages(index);
		// }
	}


	var parseHslaColor = function(h, s, l, a){
		var myHslColor = 'hsla(' + h + ', ' + s + '%, ' + l + '%, ' + a +')';
		//console.log('called calculateAngle function');
		return myHslColor;
	}	
 
	Object.size = function(obj) {
	    var size = 0, key;
	    for (key in obj) {
	        if (obj.hasOwnProperty(key)) size++;
	    }
	    return size;
	};

});