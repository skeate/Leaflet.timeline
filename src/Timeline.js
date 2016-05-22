/* global L */

import IntervalTree from 'diesal/src/ds/IntervalTree';

L.Timeline = L.GeoJSON.extend({
  times: [],
  ranges: null,

  /**
   * @constructor
   * @param {Object} geojson The GeoJSON data for this layer
   * @param {Object} options Hash of options
   * @param {Function} [options.getInterval] A function which returns an object
   * with `start` and `end` properties, called for each feature in the GeoJSON
   * data.
   * @param {Boolean} [options.drawOnSetTime=true] Make the layer draw as soon
   * as `setTime` is called. If this is set to false, you will need to call
   * `updateDisplayedLayers()` manually.
   */
  initialize(geojson, options = {}) {
    // Some functionality was changed after Leaflet 0.7; some people use the
    // latest stable, some use the beta. This should work either way, so we need
    // a version check.
    this.ranges = new IntervalTree();
    const semver = /^(\d+)(\.(\d+))?(\.(\d+))?(-(.*))?(\+(.*))?$/;
    const [, major,, minor] = semver.exec(L.version);
    this.isOldVersion = parseInt(major, 10) === 0 && parseInt(minor, 10) <= 7;
    const defaultOptions = {
      drawOnSetTime: true,
    };
    L.GeoJSON.prototype.initialize.call(this, null, options);
    L.Util.setOptions(this, defaultOptions);
    L.Util.setOptions(this, options);
    if (this.options.getInterval) {
      this._getInterval = (...args) => this.options.getInterval(...args);
    }
    if (geojson) {
      this._process(geojson);
    }
  },

  _getInterval(feature) {
    return {
      start: new Date(feature.properties.start).getTime(),
      end: new Date(feature.properties.end).getTime(),
    };
  },

  /**
   * Finds the first and last times in the dataset, adds all times into an
   * array, and puts everything into an IntervalTree for quick lookup.
   *
   * @param {Object} data GeoJSON to process
   */
  _process(data) {
    // In case we don't have a manually set start or end time, we need to find
    // the extremes in the data. We can do that while we're inserting everything
    // into the interval tree.
    let start = Infinity;
    let end = -Infinity;
    data.features.forEach((feature) => {
      const interval = this._getInterval(feature);
      this.ranges.insert(interval.start, interval.end, feature);
      this.times.push(interval.start);
      this.times.push(interval.end);
      start = Math.min(start, interval.start);
      end = Math.max(end, interval.end);
    });
    this.start = this.options.start || start;
    this.end = this.options.end || end;
    this.time = this.start;
    if (this.times.length === 0) {
      return;
    }
    // default sort is lexicographic, even for number types. so need to
    // specify sorting function.
    this.times.sort((a, b) => a - b);
    // de-duplicate the times
    this.times = this.times.reduce((newList, x, i) => {
      if (i === 0) {
        return newList;
      }
      const lastTime = newList[newList.length - 1];
      if (lastTime !== x) {
        newList.push(x);
      }
      return newList;
    }, [this.times[0]]);
  },

  /**
   * Sets the time for this layer.
   *
   * @param {Number|String} time The time to set. Usually a number, but if your
   * data is really time-based then you can pass a string (e.g. '2015-01-01')
   * and it will be processed into a number automatically.
   */
  setTime(time) {
    this.time = typeof time === 'number' ? time : new Date(time).getTime();
    if (this.options.drawOnSetTime) {
      this.updateDisplayedLayers();
    }
    this.fire('change');
  },

  /**
   * Update the layer to show only the features that are relevant at the current
   * time. Usually shouldn't need to be called manually, unless you set
   * `drawOnSetTime` to `false`.
   */
  updateDisplayedLayers() {
    // This loop is intended to help optimize things a bit. First, we find all
    // the features that should be displayed at the current time.
    const features = this.ranges.lookup(this.time);
    // Then we try to match each currently displayed layer up to a feature. If
    // we find a match, then we remove it from the feature list. If we don't
    // find a match, then the displayed layer is no longer valid at this time.
    // We should remove it.
    for (let i = 0; i < this.getLayers().length; i++) {
      let found = false;
      const layer = this.getLayers()[i];
      for (let j = 0; j < features.length; j++) {
        if (layer.feature === features[j]) {
          found = true;
          features.splice(j, 1);
          break;
        }
      }
      if (!found) {
        const toRemove = this.getLayers()[i--];
        this.removeLayer(toRemove);
      }
    }
    // Finally, with any features left, they must be new data! We can add them.
    features.forEach((feature) => this.addData(feature));
  }

});

L.timeline = (geojson, options) => new L.Timeline(geojson, options);
