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
    iconAnchor:   [0, 0], // point of the icon which will correspond to marker's location
    shadowAnchor: [-20, -20],  // the same for the shadow
    popupAnchor:  [20, 0] // point from which the popup should open relative to the iconAnchor
});

var trainIcon = L.icon({
    iconUrl: 'images/train-icon.png',

    iconSize:     [40, 40], // size of the icon
    shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [0, 0], // point of the icon which will correspond to marker's location
    shadowAnchor: [-20, -20],  // the same for the shadow
    popupAnchor:  [20, 0] // point from which the popup should open relative to the iconAnchor
});

var drinkIcon = L.icon({
    iconUrl: 'images/drink-icon.png',

    iconSize:     [40, 40], // size of the icon
    shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [0, 0], // point of the icon which will correspond to marker's location
    shadowAnchor: [-20, -20],  // the same for the shadow
    popupAnchor:  [20, 0] // point from which the popup should open relative to the iconAnchor
});

var bookIcon = L.icon({
    iconUrl: 'images/books-icon.png',

    iconSize:     [40, 40], // size of the icon
    shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [0, 0], // point of the icon which will correspond to marker's location
    shadowAnchor: [-20, -20],  // the same for the shadow
    popupAnchor:  [20, 0] // point from which the popup should open relative to the iconAnchor
});


var hatIcon =  L.icon({
    iconUrl: 'images/hat-icon.png',

    iconSize:     [40, 40], // size of the icon
    shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [0, 0], // point of the icon which will correspond to marker's location
    shadowAnchor: [-20, -20],  // the same for the shadow
    popupAnchor:  [20, 0] // point from which the popup should open relative to the iconAnchor
});

//set up geocoder
var geocoder = new L.Control.Geocoder();
geocoder.addTo(map);

var showCrimeData = true;

var numberOfCrimesPerArea = 0;	
var numberOfBusStopsInArea = 0;
var numberOfSchoolsInArea = 0;
var numberOfPubsinArea = 0;
var tooManyCrimes = false;

var busStopLayer = null;
var schoolLayer = null;
var pubLayer = null;
var heat=null;
var bounds,boundsString;

var markerLimitPerLayer = 200;
var minZoomLevel=12;
//function that runs on load
function initialise () {
	addInfoBoxToSideBar("Zoom in more or search in the top-right corner to view points of interest.", 'zoom-info');
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


	var zoom = map.getZoom();

	if(zoom > minZoomLevel) {
		//remove the info box about zoom
		removeItemByClassName('zoom-info');

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
		
		//house pricing
		updateHousePriceInfoBox ();
		
		//overall rating
		updateOverallInfoBox ()
	}else{
		//add info box about zoom
		addInfoBoxToSideBar("Zoom in more or search in the top-right corner to view points of interest.", 'zoom-info');

		//remove all info boxes
		removeItemByClassName('crime-info');
		removeItemByClassName('bus-stop-info');
		removeItemByClassName('pub-info');
		removeItemByClassName('school-info');
		removeItemByClassName('house-price-info');
		removeItemByClassName('overall-info');

		//remove all layers
		if(busStopLayer!==null)
			map.removeLayer(busStopLayer);
		if(schoolLayer!==null)
			map.removeLayer(schoolLayer);
		if(pubLayer!==null)
			map.removeLayer(pubLayer);
		
		showCrimeData =false;
		if(heat !=null)
			{heat.remove(map);}

	}
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
				tooManyCrimes = false;
				updateOverallInfoBox();
				
				//update the number of crimes on the info box
				//updateCrimeInfoBox();  <---commented this out but it might break something
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
				tooManyCrimes = true;
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
	if(checked && map.getZoom()>minZoomLevel) {
		
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

	console.log("searching for transport stops");
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

var averagePrice = 0;
function updateHousePriceInfoBox () {
	var checked = $('#house-prices').prop('checked');
	var className = "house-price-info";
	
	
	if(checked && map.getZoom()>minZoomLevel) {
		
		nearestPostcode(map.getCenter().lng, map.getCenter().lat, function(result) {
			if(result != null){
				console.log(result[0].postcode);
				var matchedRecord;
				//try to find a match for the postcode directly
				matchedRecord = housePricing.filter(record => result[0].postcode.includes(record.postcode))[0];
				//if you cant get a full match, just do a rough area match 
				if(matchedRecord != null) {
					//display for exact postcode
					addInfoBoxToSideBar("Average house price of " + result[0].postcode + ": £" + matchedRecord.averagePrice , className);

					
				} else {
					//doing the display for rough area
					matchedRecord = housePricing.filter(record => record.postcode.substring(0,4) === result[0].postcode.substring(0,4))[0];
					addInfoBoxToSideBar("Average house price of " + matchedRecord.postcode.substring(0, matchedRecord.postcode.length - 1) + " area: £" + matchedRecord.averagePrice , className);
				}
				averagePrice = matchedRecord.averagePrice;
				
				
			}
		});
	}

	//turn off bus stop layer
	else {		
		//remove info box
		removeItemByClassName(className);
	}
}

function updateOverallInfoBox () {
	var checked = $('#overall').prop('checked');
	var className = "overall-info";
	
	
	var numChecked = 0; //value used to determine average
	var total = 0;
	if(checked && map.getZoom()>minZoomLevel) {
		if($('#house-prices').prop('checked')) {
			numChecked++;
			var houseIndex = housePricingSorted.findIndex(function(item, i) {
				return item.averagePrice === averagePrice;
			});
			
			//get what percent this house is cheaper than all of the average house prices in the UK
			//basically "this house is within the top X% of houses in terms of pricing"
			var calc = houseIndex / housePricingSorted.length;
			total += Math.min(Math.max(calc, 0), 1);
			
		}
		if($('#schools').prop('checked')) {
			numChecked++;
			if(schoolLayer.getLayers().length > 0) {
				//console.log(schoolLayer.getLayers());
				var distanceToClosestSchool = L.GeometryUtil.closestLayer(map, [schoolLayer], map.getCenter());
				//L.marker([map.getCenter().lat, map.getCenter().lng]).addTo(map);
				var distance = map.distance(map.getCenter(), L.latLng(distanceToClosestSchool.latlng.lat, distanceToClosestSchool.latlng.lng));
				var calc = 1 - (distance / 3000);
				total += Math.min(Math.max(calc, 0), 1);		
				
				//L.marker([distanceToClosestSchool.latlng.lat, distanceToClosestSchool.latlng.lng]).addTo(map);
			} 			
		}
		if($('#crime').prop('checked') && !tooManyCrimes) {
			numChecked++;
			//console.log(numberOfCrimesPerArea + " / (5000 / (" + map.getZoom() + " / 4)) = " + numberOfCrimesPerArea + " / " + 5000 / (map.getZoom() / 4) );
			var calc = 1 - (numberOfCrimesPerArea / Math.pow((20 - map.getZoom()), 4.5)) ;
			total += Math.min(Math.max(calc, 0), 1);
		}
		if($('#bus-stops').prop('checked')) {
			numChecked++;
			if(busStopLayer.getLayers().length > 0) {
				var distanceToClosestSchool = L.GeometryUtil.closestLayer(map, [busStopLayer], map.getCenter());
				//L.marker([map.getCenter().lat, map.getCenter().lng]).addTo(map);
				var distance = map.distance(map.getCenter(), L.latLng(distanceToClosestSchool.latlng.lat, distanceToClosestSchool.latlng.lng));
				
				var calc = 1 - (distance / 1000);
				total += Math.min(Math.max(calc, 0), 1);	
				
				//L.marker([distanceToClosestSchool.latlng.lat, distanceToClosestSchool.latlng.lng]).addTo(map);
			} 			
		}
		if($('#pubs').prop('checked')) {
			numChecked++;
			if(pubLayer.getLayers().length > 0) {
				var distanceToClosestSchool = L.GeometryUtil.closestLayer(map, [pubLayer], map.getCenter());
				//L.marker([map.getCenter().lat, map.getCenter().lng]).addTo(map);
				var distance = map.distance(map.getCenter(), L.latLng(distanceToClosestSchool.latlng.lat, distanceToClosestSchool.latlng.lng));
				
				var calc = 1 - (distance / 5000);
				total += Math.min(Math.max(calc, 0), 1);			
				
				//L.marker([distanceToClosestSchool.latlng.lat, distanceToClosestSchool.latlng.lng]).addTo(map);
			} 
		}
		
		var rating = total / numChecked;
		if(!isNaN(rating)) {
			addInfoBoxToSideBar(Math.round(total / numChecked * 100) + "/100 overall rating!" , className);
		} else {
			addInfoBoxToSideBar("Please select one or more filters to calculate your overall rating!" , className);
		}
		
		
	} else {
		removeItemByClassName(className);
	}

}


initialise();
