//set up map
var map = new L.Map("map", {
	center: [50.9717, -3.6891 ],
	zoom: 6
})
.addLayer(new L.TileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"));


//set up geocoder
var geocoder = new L.Control.Geocoder();
	geocoder.addTo(map);

var heat;

function addCrimeToHeat(data) {
	console.log(data);
	var heatData = [];
	//data.forEach(function (d) {
		
	//});
	
	//heat = L.heatLayer(data, {radius: 12.5}).addTo(map);
};

//Get updated crime data 	
map.on('moveend', function() { 
	var bounds = map.getBounds();
	var boundsString = bounds.getNorthEast().lat + "," + bounds.getNorthEast().lng + ":" + bounds.getNorthWest().lat + "," + bounds.getNorthWest().lng + ":" + bounds.getSouthWest().lat + "," + bounds.getSouthWest().lng + ":" + bounds.getSouthEast().lat + "," + bounds.getSouthEast().lng;
	var requestString = "https://data.police.uk/api/crimes-street/all-crime?poly=" + boundsString;
	 //console.log(map.getBounds());
	
	$.ajax({
		url: requestString,
		type: "GET",
		success: function(result) {
			addCrimeToHeat(result);
		},
		error: function(error) {
			console.log("Too much data returned.");
		}
	});
	

});


// add code for crime rate
// create the control on the top left
var crimeTick = L.control({position: 'topleft'});
// what to do when it's added to the map 
crimeTick.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'crimeRate');
	//html for the control, in this case checkbox
    div.innerHTML = '<form><input id="crimeRate" type="checkbox"/>Crime Rate Display</form>'; 
    return div;
};
// actually add it
crimeTick.addTo(map);
// function that will be called when the checkbox is ticked
function handleCrime() {
	
   alert("Clicked, checked = " + this.checked);
}
//add the handler so that the handleCrime function is called on click
document.getElementById ("crimeRate").addEventListener ("click", handleCrime, false);