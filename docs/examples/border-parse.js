var fs = require('fs');
var data = require('./borders.json');

var parsed_data = {
  type: "FeatureCollection",
  features: data.features.map(function(country){
    return {
      type: "Feature",
      properties: {
        name: country.properties.CNTRY_NAME,
        start: (new Date(
          country.properties.COWSYEAR + '-' +
          country.properties.COWSMONTH + '-' +
          country.properties.COWSDAY
        )).getTime(),
        end: (new Date(
          country.properties.COWEYEAR + '-' +
          country.properties.COWEMONTH + '-' +
          country.properties.COWEDAY
        )).getTime()
      },
      geometry: country.geometry
    };
  })
};

fs.writeFile('borders-parsed.jsonp', 'onLoadData(' + JSON.stringify(parsed_data) + ');');
