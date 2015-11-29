/* global L, require */

// webpack requires
require('./leaflet.timeline.sass');

import IntervalTree from 'diesal/src/ds/IntervalTree';

L.TimelineVersion = '1.0.0';

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
    L.GeoJSON.prototype.initialize.call(this, undefined, options);
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

L.Timeline.TimeSliderControl = L.Control.extend({
  initialize(timeline) {
    this.timeline = timeline;
    this.options.position = timeline.options.position;
    this.start = timeline.options.start;
    this.end = timeline.options.end;
    this.showTicks = timeline.options.showTicks;
    this.stepDuration = timeline.options.duration / timeline.options.steps;
    this.stepSize = (this.end - this.start) / timeline.options.steps;
  },

  _buildDataList(container, times) {
    this._datalist = L.DomUtil.create('datalist', '', container);
    const datalistSelect = L.DomUtil.create('select', '', this._datalist);
    times.forEach((time) => {
      L.DomUtil.create('option', '', datalistSelect).value = time;
    });
    const idNum = Math.floor(Math.random() * 1000000);
    this._datalist.id = `timeline-datalist-${idNum}`;
    this._timeSlider.setAttribute('list', this._datalist.id);
  },

  _makeButton(container, name, handler) {
    const button = L.DomUtil.create('button', name, container);
    button.addEventListener('click', () => this[handler]());
    L.DomEvent.disableClickPropagation(button);
    return button;
  },

  _makeControls(container) {
    this._prevButton = this._makeButton(container, 'prev', '_prev');
    this._playButton = this._makeButton(container, 'play', '_play');
    this._pauseButton = this._makeButton(container, 'pause', '_pause');
    this._nextButton = this._makeButton(container, 'next', '_next');
  },

  _makeSlider(container) {
    const slider = L.DomUtil.create('input', 'time-slider', container);
    slider.type = 'range';
    slider.min = this.start;
    slider.max = this.end;
    slider.value = this.start;
    slider.addEventListener('input change', () => this._sliderChanged());
    slider.addEventListener('mousedown', () => this.map.dragging.disable());
    document.addEventListener('mouseup', () => this.map.dragging.enable());
    this._timeSlider = slider;
  },

  _makeOutput(container) {
    this._output = L.DomUtil.create('output', 'time-text', container);
    this._output.innerHTML = this.timeline.options.formatDate(
      new Date(this.start)
    );
  },

  _addKeyListeners() {
    this._listener = this._onKeydown.bind(this);
    document.addEventListener('keydown', this._listener);
  },

  _removeKeyListeners() {
    document.removeEventListener('keydown', this._listener);
  },

  _onKeydown(e) {
    switch (e.keyCode || e.which) {
      case 37: this._prev(); break;
      case 39: this._next(); break;
      case 32: this._toggle(); break;
      default: return;
    }
    e.preventDefault();
  },

  _nearestEventTime(findTime, mode = 0) {
    let retNext = false;
    let lastTime = this.timeline.times[0];
    for (const time of this.timeline.times) {
      if (retNext) {
        return time;
      }
      if (time >= findTime) {
        if (mode === -1) {
          return lastTime;
        }
        else if (mode === 1) {
          if (time === findTime) {
            retNext = true;
          }
          else {
            return time;
          }
        }
        else {
          const prevDiff = Math.abs(findTime - lastTime);
          const nextDiff = Math.abs(findTime - time);
          return prevDiff < nextDiff ? lastTime : time;
        }
      }
      lastTime = time;
    }
    return lastTime;
  },

  _toggle() {
    if (this._playing) {
      this._pause();
    }
    else {
      this._play();
    }
  },

  _prev() {
    this._pause();
    const prevTime = this._nearestEventTime(this.timeline.time, -1);
    this._timeSlider.value = prevTime;
    this._sliderChanged({
      type: 'change',
      target: {value: prevTime},
    });
  },

  _pause() {
    clearTimeout(this._timer);
    this._playing = false;
    this.container.classList.remove('playing');
  },

  _play() {
    clearTimeout(this._timer);
    if (parseInt(this._timeSlider.value, 10) === this.end) {
      this._timeSlider.value = this.start;
    }
    this._timeSlider.value = parseInt(this._timeSlider.value, 10)
      + this.stepSize;
    this._sliderChanged({
      type: 'change',
      target: {value: this._timeSlider.value},
    });
    if (parseInt(this._timeSlider.value, 10) === this.end) {
      this._playing = false;
      this.container.classList.remove('playing');
    }
    else {
      this._playing = true;
      this.container.classList.add('playing');
      this._timer = setTimeout(() => this._play(), this.stepDuration);
    }
  },

  _next() {
    this._pause();
    const nextTime = this._nearestEventTime(this.timeline.time, 1);
    this._timeSlider.value = nextTime;
    this._sliderChanged({
      type: 'change',
      target: {value: nextTime},
    });
  },

  _sliderChanged(e) {
    const time = parseInt(e.target.value, 10);
    if (!this.timeline.options.waitToUpdateMap || e.type === 'change') {
      this.timeline.setTime(time);
    }
    this._output.innerHTML = this.timeline.options.formatDate(new Date(time));
  },

  onAdd(map) {
    this.map = map;
    const container = L.DomUtil.create(
      'div',
      'leaflet-control-layers leaflet-control-layers-expanded '
      + 'leaflet-timeline-controls'
    );
    let sliderCtrlC;
    if (this.timeline.options.enablePlayback) {
      sliderCtrlC = L.DomUtil.create(
        'div',
        'sldr-ctrl-container',
        container
      );
      const buttonContainer = L.DomUtil.create(
        'div',
        'button-container',
        sliderCtrlC
      );
      this._makeControls(buttonContainer);
      if (this.timeline.options.enableKeyboardControls) {
        this._addKeyListeners();
      }
    }
    this._makeSlider(container);
    this._makeOutput(sliderCtrlC);
    if (this.showTicks) {
      this._buildDataList(container, this.timeline.times);
    }
    this.timeline.setTime(this.start);
    this.container = container;
    return container;
  },

  onRemove() {
    if (this.timeline.options.enableKeyboardControls) {
      this._removeKeyListeners();
    }
  },
});

L.timeline = (timedGeoJSON, options) => new L.Timeline(timedGeoJSON, options);
L.Timeline.timeSliderControl = (timeline, start, end, timelist) =>
  new L.Timeline.TimeSliderControl(timeline, start, end, timelist);
