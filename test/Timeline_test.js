/* global L, chai, should, sinon */
/* eslint-disable no-unused-expressions */

import '../src/Timeline';

describe('Timeline', () => {
  const geojson = {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]
          ]
        },
        "properties": {
          "start": 473421600000,
          "end": 1420106400000
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [100.0, 0.0],
            [101.0, 0.0],
            [101.0, 1.0],
            [100.0, 1.0],
            [100.0, 0.0]
          ]]
        },
        "properties": {
          "start": 0,
          "end": 946720800000
        }
      }
    ]
  };
  let map;

  beforeEach(() => {
    const mapDiv = document.createElement('div');
    mapDiv.id = 'map';
    document.body.appendChild(mapDiv);
    const osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const osmAttrib = '&copy; <a href="http://openstreetmap.org/copyright">'
      + 'OpenStreetMap</a> contributors';
    const osm = L.tileLayer(osmUrl, {
      maxZoom: 18,
      attribution: osmAttrib,
      noWrap: true,
    });
    map = L.map('map', {
      layers: [osm],
      center: new L.LatLng(0, 0),
      zoom: 3,
      maxBounds: [[90, -180], [-90, 180]],
    });
  });

  afterEach(() => {
    const mapDiv = document.getElementById('map');
    mapDiv.parentNode.removeChild(mapDiv);
  });

  it('should add to the map', () => {
    const layer = L.timeline();
    map.addLayer(layer);
    map.hasLayer(layer).should.equal(true);
  });

  it('should process the data', () => {
    const layer = L.timeline(geojson);
    layer.start.should.equal(0);
    layer.end.should.equal(1420106400000);
    layer.start.should.equal(0);
  });

  it('should accept a function to get interval', () => {
    const spy = sinon.spy((feature) => ({
      start: feature.properties.start,
      end: feature.properties.end,
    }));
    const layer = L.timeline(geojson, {
      getInterval: spy,
    });
    layer.start.should.equal(0);
    layer.end.should.equal(1420106400000);
    spy.should.have.been.called;
  });

  it('should accept arbitrary start/end times', () => {
    const layer = L.timeline(geojson, {
      start: 56,
      end: 32553,
    });
    layer.start.should.equal(56);
    layer.end.should.equal(32553);
  });

  it('should adjust layers on setTime', () => {
    const layer = L.timeline(geojson);
    layer.setTime(124);
    layer.getLayers().length.should.equal(1);
    layer.getLayers()[0].feature.should.equal(geojson.features[1]);
    layer.setTime('1985-06-15');
    layer.getLayers().length.should.equal(2);
    layer.setTime('2000-01-02');
    layer.getLayers().length.should.equal(1);
  });
});
