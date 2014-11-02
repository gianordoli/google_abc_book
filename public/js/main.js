var socket = io();

$(document).ready(function () {

	console.log('Called server.');
	socket.on('write', function(data) {
		console.log(data);
		$('<img src='+data+'>').appendTo('#container');
	});

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

	var results = [];

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
		for(var i = 65; i < 91; i++){
			// console.log(String.fromCharCode(i));
			var value = String.fromCharCode(i);
			getAutocomplete(value);
		}
	});

	function getAutocomplete(value){
	    $.ajax({
	      url: 'http'+(opts.secure?'s':'')+'://clients1.google.com/complete/search',
	      dataType: 'jsonp',
	      data: {
	        q: value,
	        nolabels: 't',
	        client: service.client,
	        ds: service.ds
	      },
	      success: function(data) {
	      	// console.log(data);
	      	var options = $.map(data[1], function(item){
	          return $("<span>").html(item[0]).text();
	        });
	        // console.log(options.length);
	        // console.log(options);
	        console.log(options[0]);
      		results.push(options[0]);
      		if(results.length == 26){
      			results.sort();
      			console.log(results);

      			getImages();
      		}
	      },
	      error: function(){
	      	console.log('error');
	      }
	    });
	}

	function getImages(){
		for(var i = 0; i < results.length; i++){
			// Call web scraping
			socket.emit('search', results[i]);
		}
	}

 
});