function getLocationFromPostcode(postcode,callback) {
	//https://postcodes.io/
	var url = "https://api.postcodes.io/postcodes/" + postcode;

	$.get( url, function( data ) {
		if(data.status === 200){
			console.log( data.result );
			callback(data.result);
		}
	});


}
