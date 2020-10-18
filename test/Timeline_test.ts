import L = require("leaflet");
import { TimedGeoJSON } from "../src/Timeline";
import "../src/Timeline";

describe("Timeline", () => {
  const geojson: TimedGeoJSON = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [102.0, 0.0],
            [103.0, 1.0],
            [104.0, 0.0],
            [105.0, 1.0]
          ]
        },
        properties: {
          start: 473421600000,
          end: 1420106400000
        }
      },
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [100.0, 0.0],
              [101.0, 0.0],
              [101.0, 1.0],
              [100.0, 1.0],
              [100.0, 0.0]
            ]
          ]
        },
        properties: {
          start: 0,
          end: 946720800000
        }
      },
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [100.0, 0.0],
              [101.0, 0.0],
              [101.0, 2.0],
              [100.0, 2.0],
              [100.0, 0.0]
            ]
          ]
        },
        properties: {
          start: 473421600000,
          end: 946720800000
        }
      }
    ]
  };
  let map: L.Map;

  beforeEach(() => {
    const mapDiv = document.createElement("div");
    mapDiv.id = "map";
    document.body.appendChild(mapDiv);
    const osmUrl = "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    const osmAttrib =
      '&copy; <a href="http://openstreetmap.org/copyright">' +
      "OpenStreetMap</a> contributors";
    const osm = L.tileLayer(osmUrl, {
      maxZoom: 18,
      attribution: osmAttrib,
      noWrap: true
    });
    map = L.map("map", {
      layers: [osm],
      center: new L.LatLng(0, 0),
      zoom: 3,
      maxBounds: [
        [90, -180],
        [-90, 180]
      ]
    });
  });

  afterEach(() => {
    const mapDiv = document.getElementById("map");
    mapDiv?.parentNode?.removeChild(mapDiv);
  });

  it("should add to the map", () => {
    const layer = L.timeline();
    map.addLayer(layer);
    expect(map.hasLayer(layer)).toBe(true);
  });

  it("should process the data", () => {
    const layer = L.timeline(geojson);
    expect(layer.start).toEqual(0);
    expect(layer.end).toEqual(1420106400000);
    expect(layer.times).toStrictEqual([0, 473421600000, 946720800000, 1420106400000]);
  });

  it("should handle a lack of time data", () => {
    const layer = L.timeline({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [102, 0.5]
          },
          properties: {}
        }
      ]
    });
    expect(layer.start).toEqual(Infinity);
    expect(layer.end).toEqual(-Infinity);
  });

  it("should accept a function to get interval", () => {
    const spy = jest.fn(feature => ({
      start: feature.properties.start,
      end: feature.properties.end
    }));
    const layer = L.timeline(geojson, {
      getInterval: spy
    });
    expect(layer.start).toEqual(0);
    expect(layer.end).toEqual(1420106400000);
    expect(spy).toHaveBeenCalled();
  });

  it("should accept arbitrary start/end times", () => {
    const layer = L.timeline(geojson, {
      start: 56,
      end: 32553
    });
    expect(layer.start).toEqual(56);
    expect(layer.end).toEqual(32553);
  });

  it("should adjust layers on setTime", () => {
    const layer = L.timeline(geojson);
    layer.setTime(124);
    expect(layer.getLayers()).toHaveLength(1);
    expect(layer.getLayers()[0].feature).toEqual(geojson.features[1]);
    layer.setTime("1985-06-15");
    expect(layer.getLayers()).toHaveLength(3);
    layer.setTime("2000-01-02");
    expect(layer.getLayers()).toHaveLength(1);
  });

  it("should accept a boolean to not draw as soon as setTime is called", () => {
    const layer = L.timeline(geojson, {
      drawOnSetTime: false
    });
    layer.setTime(124);
    expect(layer.getLayers()).toHaveLength(0);
    layer.updateDisplayedLayers();
    expect(layer.getLayers()).toHaveLength(1);
  });

  it("should allow the start interval to be considered exclusive", () => {
    geojson.features.forEach((f) => (f.properties.startExclusive = false));
    let layer = L.timeline(geojson);
    layer.setTime(473421600000);
    expect(layer.getLayers()).toHaveLength(3);
    geojson.features.forEach((f) => (f.properties.startExclusive = true));
    layer = L.timeline(geojson);
    layer.setTime(473421600000);
    expect(layer.getLayers()).toHaveLength(1);
    layer.setTime(473421600000 + 1);
    expect(layer.getLayers()).toHaveLength(3);
  });
});
