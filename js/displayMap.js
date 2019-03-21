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
// depending on a crime category, return a different intensity from 0 - 1 for the heatmap
function getHeatIntensityFromCrime(crimeName) {
	switch (crimeName) {
		case "bicycle-theft": return 0.15;
		case "anti-social-behaviour": return 0.05;
		case "burglary": return 0.35;
		case "criminal-damage-arson": return 0.75;
		case "drugs": return 0.45;
		case "other-theft": return 0.25;
		case "possession-of-weapons": return 0.85;
		case "public-order": return 0.25;
		case "robbery": return 0.4;
		case "shoplifting": return 0.2;
		case "theft-from-the-person": return 0.6;
		case "vehicle-crime": return 0.6;
		case "violent-crime": return 0.9;
		case "other-crime": return 0.5;
		default: return 0;
	}
}
// 
function addCrimeToHeat(data) {
	// if heatmap exists, delete it so we dont stack the heatmaps
	if(heat != null) {
		heat.remove(map);
	}
	// set up an array for it
	var heatData = [];
	data.forEach(function (d) {
		// longitude, latitude, intensity for the array 
		heatData.push([d.location.latitude, d.location.longitude, getHeatIntensityFromCrime(d.category)]);
	});
	// load array into heatLayer and add to the map 
	heat = L.heatLayer(heatData, {radius: 15, 0.4: 'blue', 0.65: 'lime', 1: 'red', max: 0.5}).addTo(map);
};

//Get updated crime data whenever the map moves
map.on('moveend', function() { 
	var bounds = map.getBounds();
	var boundsString = bounds.getNorthEast().lat + "," + bounds.getNorthEast().lng + ":" + bounds.getNorthWest().lat + "," + bounds.getNorthWest().lng + ":" + bounds.getSouthWest().lat + "," + bounds.getSouthWest().lng + ":" + bounds.getSouthEast().lat + "," + bounds.getSouthEast().lng;
	var requestString = "https://data.police.uk/api/crimes-street/all-crime?poly=" + boundsString;
	 //console.log(map.getBounds());
	
	$.ajax({
		url: requestString,
		type: "GET",
		success: function(result) {
			//go use the data and add it to the heatmap
			addCrimeToHeat(result);
		},
		// The Police API will 503 when >10k crimes for the area
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






function toggleCrime(checkbox) {
	var className = "crime-info";
	checkbox.checked?addInfoBoxToSideBar(5 + " crimes over the last month" , className) : removeInfoBoxFromSideBar(className);

}


function toggleSchools(checkbox) {
	var className = "school-info";
	checkbox.checked?addInfoBoxToSideBar(5 + " schools around" , className) : removeInfoBoxFromSideBar(className);

}


function togglePubs(checkbox) {
	var className = "pub-info";
	checkbox.checked?addInfoBoxToSideBar(5 + " places to eat around" , className) : removeInfoBoxFromSideBar(className);

}


function toggleBusStops(checkbox) {
	var className = "bus-stop-info";
	checkbox.checked?addInfoBoxToSideBar(5 + " bus stops nearby" , className) : removeInfoBoxFromSideBar(className);
}


function addInfoBoxToSideBar (text, className) {

var infoBox = {
    class: "info-box " + className,
    css: {
      "color": "Green"
    },
};
var $div = $("<div>", infoBox);
  $div.html(text);
  $(".info-side-bar").append($div);
}

function removeInfoBoxFromSideBar (className) {
	$('.' + className).remove();
}