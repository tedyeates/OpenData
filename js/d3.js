Promise.all([
    d3.csv("data/crime.csv", function(d){
      return d
    }),
    d3.csv("open_pubs.csv", function(d){
      return d
    }),
    d3.csv("school.csv", function(d){
        return d
    }),

  ]).then(function(files) {});