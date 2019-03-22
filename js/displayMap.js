//set up map
var map = new L.Map("map", {
	center: [50.9717, -3.6891 ],
	zoom: 6
})
.addLayer(new L.TileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"));

//Define icons
//http://www.iconarchive.com/
var busIcon = L.icon({
    iconUrl: 'images/bus-icon.png',

    iconSize:     [40, 40], // size of the icon
    shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});

var trainIcon = L.icon({
    iconUrl: 'images/train-icon.png',

    iconSize:     [40, 40], // size of the icon
    shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});

var drinkIcon = L.icon({
    iconUrl: 'images/drink-icon.png',

    iconSize:     [40, 40], // size of the icon
    shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});

var bookIcon = L.icon({
    iconUrl: 'images/books-icon.png',

    iconSize:     [40, 40], // size of the icon
    shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});


var hatIcon =  L.icon({
    iconUrl: 'images/hat-icon.png',

    iconSize:     [40, 40], // size of the icon
    shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});

//set up geocoder
var geocoder = new L.Control.Geocoder();
geocoder.addTo(map);

var showCrimeData = true;

var numberOfCrimesPerArea = 0;	
var numberOfBusStopsInArea = 0;
var numberOfSchoolsInArea = 0;
var numberOfPubsinArea = 0;

var busStopLayer = null;
var schoolLayer = null;
var pubLayer = null;
var heat=null;
var bounds,boundsString;

var markerLimitPerLayer = 100;
//function that runs on load
function initialise () {
	//uncheck crime checkbox
	updateMap();
}



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
// create heatmap based on crime and add it to the map
function addCrimeToHeat(data) {
	var className = "crime-info";
	
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
	removeItemByClassName(className);
	addInfoBoxToSideBar(numberOfCrimesPerArea + " crimes over the last month" , className);
};


//When region on map changes, this function is called. 
function updateMap() {

	bounds = map.getBounds();
	boundsString = bounds.getNorthEast().lat + "," + bounds.getNorthEast().lng + ":" + bounds.getNorthWest().lat + "," + bounds.getNorthWest().lng + ":" + bounds.getSouthWest().lat + "," + bounds.getSouthWest().lng + ":" + bounds.getSouthEast().lat + "," + bounds.getSouthEast().lng;
	//crime
	updateCrimeInfoBox();

	//schools
	updateSchoolInfoBox();


	//bus stops
	updateBusStopInfoBox();

	//pubs
	updatePubInfoBox();

}

//send a request for data and update the crime heat map
var updateCrimeDataBasedOnBounds  = function () {
	var className = "crime-info";
	
	if(showCrimeData){
		var requestString = "https://data.police.uk/api/crimes-street/all-crime?poly=" + boundsString;		
		removeItemByClassName(className);
		addInfoBoxToSideBar("Loading crimes..." , className);
		 //console.log(map.getBounds());
		 $.ajax({
		 	url: requestString,
		 	type: "GET",
		 	success: function(result) {
		 		numberOfCrimesPerArea = result.length;
				//update the number of crimes on the info box
				updateCrimeInfoBox();
				if(showCrimeData) {
					
					//go use the data and add it to the heatmap
					addCrimeToHeat(result);
				}
				

		},
			// The Police API will 503 when >10k crimes for the area
			error: function(error) {
				console.log("GET request Error. Too much data returned.");
				removeItemByClassName(className);
				addInfoBoxToSideBar("Over 10,000 crimes over the last month, cannot display heatmap" , className);
			}
		});
		}
	};
//Get updated crime data whenever the map moves
map.on('moveend', updateMap);


//invoked when the crime check box is selected
function updateCrimeInfoBox() {

	var checked = $('#crime').prop('checked');
	var className = "crime-info";

	//remove the old layer - this helps in not painting another layer on top of the old one, if the map zooms without the checkbox controls
	if(heat !=null)
		{heat.remove(map);}


	//turn on crime stats
	if(checked) {
		//enable repainting when map is moved
		showCrimeData = true;
		
		//paint heat map
		updateCrimeDataBasedOnBounds();
		
		
	}

	//turn off crime stats
	else {

		//remove heatmap
		showCrimeData = false;
		removeItemByClassName(className);
	}
	

}

//invoked when the school check box is selected
function toggleSchools(checkbox) {

	//remove schools


	var className = "school-info";
	checkbox.checked?addInfoBoxToSideBar(5 + " schools around" , className) : removeItemByClassName(className);

}

//invoked when the pub check box is selected
function togglePubs(checkbox) {

	//remove pubs

	var className = "pub-info";
	checkbox.checked?addInfoBoxToSideBar(5 + " places to eat around" , className) : removeItemByClassName(className);

}


//Add info to the sidebar
//@text - text to include in the box
//@className - type of infobox (e.g.'school-info')
function addInfoBoxToSideBar (text, className) {
	$('.' + className).remove();

	var infoBox = {
		class: className + " info-box" 
	};
	var $div = $("<div>", infoBox);
	$div.html(text);
	$(".info-side-bar").append($div);
}

//remove an element from the webpage based on the class name
function removeItemByClassName (className) {
	$('.' + className).remove();
}


function updateBusStopLayer() {
	
	
	//reset the number of bus stops
	numberOfBusStopsInArea = 0;
	var markers = [];

	console.log("searching for bus stops");
	//loop through all bus stops
	for(var i=0; i<transport.length; i++) {
		if(numberOfBusStopsInArea > markerLimitPerLayer)
			break;
		var lat = transport[i].lat;
		var long = transport[i].lon;
		var coords = L.latLng(lat, long);
		var chosenIcon;
		//3 is bus stop, 2 is rail station, 1 is underground
		if(transport[i].originalData.vehicle_type == 3) {
			chosenIcon = busIcon;
		} else {
			chosenIcon = trainIcon;
		}

		if(lat!==null && long !==null && bounds.contains(coords)){
			let marker =  L.marker([lat, long], {
					title:transport[i].name,
					icon:chosenIcon
					
					});
			markers.push(marker);
			marker.bindPopup(transport[i].name).openPopup();
			numberOfBusStopsInArea++;
		}
	} 

	//add the bus stop layer
	busStopLayer = L.featureGroup(markers).addTo(map);
}

function updateBusStopInfoBox () {
	var checked = $('#bus-stops').prop('checked');
	var className = "bus-stop-info";
	
	//remove the old layer
	if(busStopLayer !== null){
		map.removeLayer(busStopLayer);
	}

	//turn on bus stop layer
	if(checked) {

		updateBusStopLayer();
		addInfoBoxToSideBar(numberOfBusStopsInArea + " transport stops in the area" , className);

	}

	//turn off bus stop layer
	else {		
		//remove info box
		removeItemByClassName(className);
	}
}

function updateSchoolLayer() {
	
	
	//reset the number of bus stops
	numberOfSchoolsInArea = 0;
	var markers = [];

	console.log("searching for schools");
	console.log(schools);
	//loop through all bus stops
	for(var i=0; i<schools.length; i++) {
		if(numberOfSchoolsInArea > markerLimitPerLayer)
			break;
		var lat = schools[i].lat;
		var long = schools[i].lon;

		var coords = L.latLng(lat, long);

		if(bounds.contains(coords)){       
			let marker =  L.marker([lat, long], {
				title:schools[i].name,
				icon:hatIcon});
			markers.push(marker);
			marker.bindPopup(schools[i].name).openPopup();
			numberOfSchoolsInArea++;
		}

		
	} 

	//add the bus stop layer
	schoolLayer = L.featureGroup(markers).addTo(map);
}

function updateSchoolInfoBox () {
	var checked = $('#schools').prop('checked');
	var className = "school-info";
	
	//remove the old layer
	if(schoolLayer !== null){
		map.removeLayer(schoolLayer);
	}

	//turn on bus stop layer
	if(checked) {

		updateSchoolLayer();
		addInfoBoxToSideBar(numberOfSchoolsInArea + " schools in the area" , className);

	}

	//turn off bus stop layer
	else {		
		//remove info box
		removeItemByClassName(className);
	}
}




function updatePubLayer() {
	
	
	//reset the number of bus stops
	numberOfPubsinArea = 0;
	var markers = [];

	console.log("searching for pubs");
	//loop through all bus stops
	for(var i=0; i<pubs.length; i++) {
		if(numberOfPubsinArea > markerLimitPerLayer)
			break;
		var lat = pubs[i].lat;
		var long = pubs[i].lon;
		var coords = L.latLng(lat, long);

		if(bounds.contains(coords)){      
			let marker =  L.marker([lat, long], {
				title:pubs[i].name,
				icon:drinkIcon});
			markers.push(marker);
			marker.bindPopup(pubs[i].name).openPopup();
			numberOfPubsinArea++;
		}

		
	} 

	//add the bus stop layer
	pubLayer = L.featureGroup(markers).addTo(map);
}

function updatePubInfoBox () {
	var checked = $('#pubs').prop('checked');
	var className = "pub-info";
	
	//remove the old layer
	if(pubLayer !== null){
		map.removeLayer(pubLayer);
	}

	//turn on bus stop layer
	if(checked) {

		updatePubLayer();
		addInfoBoxToSideBar(numberOfPubsinArea + " pubs in the area" , className);

	}

	//turn off bus stop layer
	else {		
		//remove info box
		removeItemByClassName(className);
	}
}

initialise();
