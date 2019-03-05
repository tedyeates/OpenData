
var map = new L.Map("map", {
        center: [50.9717, -3.6891 ],
        zoom: 6
    })
    .addLayer(new L.TileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"));


function addPostcodeMarker(postcode) {

		var location = getLocationFromPostcode(postcode, function(location) {

			console.log(location);
	    	L.marker([location.latitude,location.longitude]).addTo(map);
		});
}

addPostcodeMarker("so172ah");