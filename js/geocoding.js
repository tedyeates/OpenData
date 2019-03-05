function getCoordinatesFromPostcode(postcode) {
	//https://postcodes.io/
	var url = "https://api.postcodes.io/postcodes/" + postcode;
	

	$.get( url, function( data ) {
		if(data.status === 200){
			console.log( data.result );
			return data.result;	
		}
	});


}

getCoordinatesFromPostcode("SO172ah");