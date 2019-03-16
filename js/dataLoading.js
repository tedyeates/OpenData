let pubs = [];
let schools = [];
let transport = [];

Promise.all([
    d3.csv("data/open_pubs.csv", function(d){
      return {
        name: d.name,
        lat: d.latitude,
        lon: d.longitude,
        originalData: d
      }
    }),
    d3.csv("data/school.csv", function(d){
        return {
          name: d.SCHNAME,
          postcode: d.POSTCODE,
          originalData: d
        }
    }),
    d3.tsv("data/transport_stops.tsv", function(d){
      return {
        name: d.stop_name,
        lat: d.stop_lat,
        lon: d.stop_lon,
        originalData: d
      }
    })

  ]).then(function(files) {
    pubs = files[0];
    schools = files[1];
    transport = files[2];

    // let postcodes = schools.map(school => {
    //   return school.originalData.POSTCODE;
    // });

    // console.log(postcodes);
    // postcodes = ["OX49 5NU", "M32 0JG", "NE30 1DP"];
    // getLocationFromPostcodeBulk(postcodes, function(d){
    //   return d;
    // });

    console.log(pubs);
    console.log(schools);
    console.log(transport);
  });

/*
  returns dictionary of pub data:
  name: name, 
  lat: latitude, 
  lon: longitude,
  originalData: data from original dataset.
*/
function getPubs(){
  return pubs;
}

/*
  returns dictionary of school data:
  name: name, 
  postcode: postcode,
  originalData: data from original dataset.
*/
function getSchools(){
  return pubs;
}

/*
  returns dictionary of transport data:
  name: name, 
  lat: latitude, 
  lon: longitude,
  originalData: data from original dataset.
*/
function getTransport(){
  return pubs;
}