/*
*function that uses an open source api to look for locations from postcodes
*this is only a back up function, use getLocationFromQuery instead
*/
function getLocationFromPostcode(postcode,callback) {
	//https://postcodes.io/
	var url = "https://api.postcodes.io/postcodes/" + postcode;

	$.get( url, function( data ) {
		if(data.status === 200){
			//console.log( data.result );
			callback(data.result);
		}
	});
}


function getLocationFromQuery(query, callback) {
	var nominatim = new L.Control.Geocoder.Nominatim();
	nominatim.geocode(query, callback(result));
}

function nearestPostcode(longitude, latitude, callback) {
	var url = "https://api.postcodes.io/postcodes?lon=" + longitude + "&lat=" + latitude;

	$.get( url, function( data ) {
		if(data.status === 200){
			callback(data.result);
		}
	});
}

function getLocationFromPostcodeBulk(postcodes, callback){
	var url = "https://api.postcodes.io/postcodes/";
	console.log("hello");

	$.post(url, {
		"postcodes" : postcodes
		}, function(data){
		console.log(data);
		if(data.status === 200){
			console.log( data.result );
			callback(data.result);
		}
	});
}