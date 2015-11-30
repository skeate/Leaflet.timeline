/* global L */

import IntervalTree from 'diesal/src/ds/IntervalTree';

L.Timeline = L.GeoJSON.extend({
  includes: L.Mixin.Events,
  times: [],
  displayedLayers: [],
  ranges: [],

  options: {
    position: 'bottomleft',
    formatDate: () => '',
    enablePlayback: true,
    enableKeyboardControls: false,
    steps: 1000,
    duration: 1000,
    showTicks: true,
    waitToUpdateMap: false,
  },

  initialize(timedGeoJSON, options) {
    this.times = [];
    L.GeoJSON.prototype.initialize.call(this, null, options);
    L.extend(this.options, options);
    this.ranges = new IntervalTree();
    if (options.intervalFromFeature) {
      this._intervalFromFeature = options.intervalFromFeature.bind(this);
    }
    if (options.addData) {
      this.addData = options.addData.bind(this);
    }
    if (options.doSetTime) {
      this.doSetTime = options.doSetTime.bind(this);
    }
    if (timedGeoJSON) {
      this._process(timedGeoJSON);
    }
  },

  _intervalFromFeature(feature) {
    return {
      start: new Date(feature.properties.start).getTime(),
      end: new Date(feature.properties.end).getTime(),
    };
  },

  _process(data) {
    // In case we don't have a manually set start or end time, we need to find
    // the extremes in the data. We can do that while we're inserting everything
    // into the interval tree.
    let earliestStart = Infinity;
    let latestEnd = -Infinity;
    data.features.forEach((feature) => {
      const interval = this._intervalFromFeature(feature);
      this.ranges.insert(interval.start, interval.end, feature);
      this.times.push(interval.start);
      this.times.push(interval.end);
      earliestStart = Math.min(earliestStart, interval.start);
      latestEnd = Math.max(latestEnd, interval.end);
    });
    this.options.start = this.options.start || earliestStart;
    this.options.end = this.options.end || latestEnd;
    this.times = this.times
    // default sort is lexicographic, even for number types. so need to
    // specify sorting function.
    .sort((a, b) => a - b)
    // de-duplicate the times
    .reduce((newList, x) => {
      if (newList[newList.length - 1] !== x) {
        newList.push(x);
      }
      return newList;
    }, []);
  },

  addData(geojson) {
    const features = L.Util.isArray(geojson) ? geojson : geojson.features;
    if (features) {
      features
      .filter((f) => f.geometries || f.geometry || f.features || f.coordinates)
      .forEach(this.addData.bind(this));
    }
    else {
      this._addData(geojson);
    }
  },

  _addData(geojson) {
    if (this.options.filter && !this.options.filter(geojson)) {
      return;
    }
    // This was changed after Leaflet 0.7; some people use the latest stable,
    // some use the beta.
    const semver = /^(\d+)(\.(\d+))?(\.(\d+))?(-(.*))?(\+(.*))?$/;
    const [, major,, minor] = semver.exec(L.version);
    const layer = L.GeoJSON.geometryToLayer(
      geojson,
      (parseInt(major, 10) === 0 && parseInt(minor, 10) <= 7)
      ? this.options.pointToLayer
      : this.options
    );
    this.displayedLayers.push({layer, geoJSON: geojson});
    layer.feature = L.GeoJSON.asFeature(geojson);
    layer.defaultOptions = layer.options;
    this.resetStyle(layer);
    if (this.options.onEachFeature) {
      this.options.onEachFeature(geojson, layer);
    }
    this.addLayer(layer);
  },

  removeLayer(layer, removeDisplayed = true) {
    L.GeoJSON.prototype.removeLayer.call(this, layer);
    if (removeDisplayed) {
      this.displayedLayers = this.displayedLayers.filter(
        (displayedLayer) => displayedLayer.layer !== layer
      );
    }
  },

  setTime(time) {
    this.time = new Date(time).getTime();
    this.doSetTime(time);
    this.fire('change');
  },

  doSetTime(time) {
    const ranges = this.ranges.lookup(time);
    let i, j, found;
    for (i = 0; i < this.displayedLayers.length; i++) {
      found = false;
      for (j = 0; j < ranges.length; j++) {
        if (this.displayedLayers[i].geoJSON === ranges[j]) {
          found = true;
          ranges.splice(j, 1);
          break;
        }
      }
      if (!found) {
        const toRemove = this.displayedLayers.splice(i--, 1);
        this.removeLayer(toRemove[0].layer, false);
      }
    }
    ranges.forEach(this.addData.bind(this));
  },

  onAdd(map) {
    L.GeoJSON.prototype.onAdd.call(this, map);
    this.timeSliderControl = L.Timeline.timeSliderControl(this);
    this.timeSliderControl.addTo(map);
  },

  onRemove(map) {
    L.GeoJSON.prototype.onRemove.call(this, map);
    this.timeSliderControl.removeFrom(map);
  },

  getDisplayed() {
    return this.ranges.lookup(this.time);
  },
});

L.timeline = (...args) => new L.Timeline(...args);
