
/*
Leaflet.timeline

Show any arbitrary GeoJSON objects changing over time

(c) 2014-15 Jonathan Skeate
https://github.com/skeate/Leaflet.timeline
http://leafletjs.com
 */

(function() {
  var IntervalTree;

  L.TimelineVersion = '0.4.2';

  IntervalTree = (function() {
    function IntervalTree() {
      this._root = null;
      this._list = null;
    }

    IntervalTree.prototype.insert = function(begin, end, value, node, parent, parentSide) {
      var new_node;
      if (node === void 0) {
        node = this._root;
      }
      if (!node) {
        new_node = {
          low: begin,
          high: end,
          max: end,
          data: value,
          left: null,
          right: null,
          parent: parent
        };
        if (parent) {
          parent[parentSide] = new_node;
        } else {
          this._root = new_node;
        }
        return new_node;
      } else {
        if (begin < node.low || begin === node.low && end < node.high) {
          new_node = this.insert(begin, end, value, node.left, node, 'left');
        } else {
          new_node = this.insert(begin, end, value, node.right, node, 'right');
        }
        node.max = Math.max(node.max, new_node.max);
      }
      return new_node;
    };

    IntervalTree.prototype.lookup = function(value, node) {
      if (node === void 0) {
        node = this._root;
        this._list = [];
      }
      if (node === null || node.max < value) {
        return [];
      }
      if (node.left !== null) {
        this.lookup(value, node.left);
      }
      if (node.low <= value) {
        if (node.high >= value) {
          this._list.push(node.data);
        }
        this.lookup(value, node.right);
      }
      return this._list;
    };

    return IntervalTree;

  })();

  L.Timeline = L.GeoJSON.extend({
    includes: L.Mixin.Events,
    times: [],
    displayedLayers: [],
    ranges: null,
    options: {
      position: "bottomleft",
      formatDate: function(date) {
        return "";
      },
      enablePlayback: true,
      enableKeyboardControls: false,
      steps: 1000,
      duration: 10000,
      showTicks: true,
      waitToUpdateMap: false
    },
    initialize: function(timedGeoJSON, options) {
      this.times = [];
      L.GeoJSON.prototype.initialize.call(this, void 0, options);
      L.extend(this.options, options);
      this.ranges = new IntervalTree();
      if (options.intervalFromFeature != null) {
        this.intervalFromFeature = options.intervalFromFeature.bind(this);
      }
      if (options.addData != null) {
        this.addData = options.addData.bind(this);
      }
      if (options.doSetTime != null) {
        this.doSetTime = options.doSetTime.bind(this);
      }
      if (timedGeoJSON != null) {
        return this.process(timedGeoJSON);
      }
    },
    intervalFromFeature: function(feature) {
      return {
        start: (new Date(feature.properties.start)).getTime(),
        end: (new Date(feature.properties.end)).getTime()
      };
    },
    process: function(data) {
      var earliestStart, latestEnd;
      earliestStart = Infinity;
      latestEnd = -Infinity;
      data.features.forEach((function(_this) {
        return function(feature) {
          var interval;
          interval = _this.intervalFromFeature(feature);
          _this.ranges.insert(interval.start, interval.end, feature);
          _this.times.push(interval.start);
          _this.times.push(interval.end);
          if (interval.start < earliestStart) {
            earliestStart = interval.start;
          }
          if (interval.end > latestEnd) {
            return latestEnd = interval.end;
          }
        };
      })(this));
      this.times = this.times.sort(function(a, b) {
        return a - b;
      });
      this.times = this.times.reduce(function(newList, x) {
        if (newList[newList.length - 1] !== x) {
          newList.push(x);
        }
        return newList;
      }, []);
      if (!this.options.start) {
        this.options.start = earliestStart;
      }
      if (!this.options.end) {
        return this.options.end = latestEnd;
      }
    },
    addData: function(geojson) {
      var feature, features, i, len;
      features = L.Util.isArray(geojson) ? geojson : geojson.features;
      if (features) {
        for (i = 0, len = features.length; i < len; i++) {
          feature = features[i];
          if (feature.geometries || feature.geometry || feature.features || feature.coordinates) {
            this.addData(feature);
          }
        }
        return this;
      }
      return this._addData(geojson);
    },
    _addData: function(geojson) {
      var a, b, c, d, e, layer, major, meta, minor, options, patch, prerelease, ref, semver;
      options = this.options;
      if (options.filter && !options.filter(geojson)) {
        return;
      }
      semver = /^(\d+)(\.(\d+))?(\.(\d+))?(-(.*))?(\+(.*))?$/;
      ref = semver.exec(L.version), a = ref[0], major = ref[1], b = ref[2], minor = ref[3], c = ref[4], patch = ref[5], d = ref[6], prerelease = ref[7], e = ref[8], meta = ref[9];
      if (parseInt(major) === 0 && parseInt(minor) <= 7) {
        layer = L.GeoJSON.geometryToLayer(geojson, options.pointToLayer);
      } else {
        layer = L.GeoJSON.geometryToLayer(geojson, options);
      }
      this.displayedLayers.push({
        layer: layer,
        geoJSON: geojson
      });
      layer.feature = L.GeoJSON.asFeature(geojson);
      layer.defaultOptions = layer.options;
      this.resetStyle(layer);
      if (options.onEachFeature) {
        options.onEachFeature(geojson, layer);
      }
      return this.addLayer(layer);
    },
    removeLayer: function(layer, removeDisplayed) {
      if (removeDisplayed == null) {
        removeDisplayed = true;
      }
      L.GeoJSON.prototype.removeLayer.call(this, layer);
      if (removeDisplayed) {
        return this.displayedLayers = this.displayedLayers.filter(function(displayedLayer) {
          return displayedLayer.layer !== layer;
        });
      }
    },
    setTime: function(time) {
      this.time = (new Date(time)).getTime();
      this.doSetTime(time);
      return this.fire('change');
    },
    doSetTime: function(time) {
      var i, len, range, ranges, results;
      ranges = this.ranges.lookup(time);
      var i, j, found;
    for( i = 0; i < this.displayedLayers.length; i++ ){
      found = false;
      for( j = 0; j < ranges.length; j++ ){
        if( this.displayedLayers[i].geoJSON === ranges[j] ){
          found = true;
          ranges.splice(j, 1);
          break;
        }
      }
      if( !found ){
        var to_remove = this.displayedLayers.splice(i--,1);
        this.removeLayer(to_remove[0].layer, false);
      }
    }
    ;
      results = [];
      for (i = 0, len = ranges.length; i < len; i++) {
        range = ranges[i];
        results.push(this.addData(range));
      }
      return results;
    },
    onAdd: function(map) {
      L.GeoJSON.prototype.onAdd.call(this, map);
      this.timeSliderControl = L.Timeline.timeSliderControl(this);
      return this.timeSliderControl.addTo(map);
    },
    onRemove: function(map) {
      L.GeoJSON.prototype.onRemove.call(this, map);
      return this.timeSliderControl.removeFrom(map);
    },
    getDisplayed: function() {
      return this.ranges.lookup(this.time);
    }
  });

  L.Timeline.TimeSliderControl = L.Control.extend({
    initialize: function(timeline1) {
      this.timeline = timeline1;
      this.options.position = this.timeline.options.position;
      this.start = this.timeline.options.start;
      this.end = this.timeline.options.end;
      this.showTicks = this.timeline.options.showTicks;
      this.stepDuration = this.timeline.options.duration / this.timeline.options.steps;
      return this.stepSize = (this.end - this.start) / this.timeline.options.steps;
    },
    _buildDataList: function(container, times) {
      var datalistSelect;
      this._datalist = L.DomUtil.create('datalist', '', container);
      datalistSelect = L.DomUtil.create('select', '', this._datalist);
      times.forEach(function(time) {
        var datalistOption;
        datalistOption = L.DomUtil.create('option', '', datalistSelect);
        return datalistOption.value = time;
      });
      this._datalist.id = "timeline-datalist-" + Math.floor(Math.random() * 1000000);
      return this._timeSlider.setAttribute('list', this._datalist.id);
    },
    _makePlayPause: function(container) {
      this._playButton = L.DomUtil.create('button', 'play', container);
      this._playButton.addEventListener('click', (function(_this) {
        return function() {
          return _this._play();
        };
      })(this));
      L.DomEvent.disableClickPropagation(this._playButton);
      this._pauseButton = L.DomUtil.create('button', 'pause', container);
      this._pauseButton.addEventListener('click', (function(_this) {
        return function() {
          return _this._pause();
        };
      })(this));
      return L.DomEvent.disableClickPropagation(this._pauseButton);
    },
    _makePrevNext: function(container) {
      this._prevButton = L.DomUtil.create('button', 'prev');
      this._nextButton = L.DomUtil.create('button', 'next');
      this._playButton.parentNode.insertBefore(this._prevButton, this._playButton);
      this._playButton.parentNode.insertBefore(this._nextButton, this._pauseButton.nextSibling);
      L.DomEvent.disableClickPropagation(this._prevButton);
      L.DomEvent.disableClickPropagation(this._nextButton);
      this._prevButton.addEventListener('click', this._prev.bind(this));
      return this._nextButton.addEventListener('click', this._next.bind(this));
    },
    _makeSlider: function(container) {
      this._timeSlider = L.DomUtil.create('input', 'time-slider', container);
      this._timeSlider.type = "range";
      this._timeSlider.min = this.start;
      this._timeSlider.max = this.end;
      this._timeSlider.value = this.start;
      this._timeSlider.addEventListener('mousedown', (function(_this) {
        return function() {
          return _this.map.dragging.disable();
        };
      })(this));
      document.addEventListener('mouseup', (function(_this) {
        return function() {
          return _this.map.dragging.enable();
        };
      })(this));
      this._timeSlider.addEventListener('input', this._sliderChanged.bind(this));
      return this._timeSlider.addEventListener('change', this._sliderChanged.bind(this));
    },
    _makeOutput: function(container) {
      this._output = L.DomUtil.create('output', 'time-text', container);
      return this._output.innerHTML = this.timeline.options.formatDate(new Date(this.start));
    },
    _addKeyListeners: function() {
      this._listener = this._onKeydown.bind(this);
      return document.addEventListener('keydown', this._listener);
    },
    _removeKeyListeners: function() {
      return document.removeEventListener('keydown', this._listener);
    },
    _onKeydown: function(e) {
      switch (e.keyCode || e.which) {
        case 37:
          this._prev();
          break;
        case 39:
          this._next();
          break;
        case 32:
          this._toggle();
          break;
        default:
          return;
      }
      return e.preventDefault();
    },
    _nearestEventTime: function(findTime, mode) {
      var i, lastTime, len, nextDiff, prevDiff, ref, retNext, time;
      if (mode == null) {
        mode = 0;
      }
      retNext = false;
      lastTime = this.timeline.times[0];
      ref = this.timeline.times.slice(1);
      for (i = 0, len = ref.length; i < len; i++) {
        time = ref[i];
        if (retNext) {
          return time;
        }
        if (time >= findTime) {
          if (mode === -1) {
            return lastTime;
          } else if (mode === 1) {
            if (time === findTime) {
              retNext = true;
            } else {
              return time;
            }
          } else {
            prevDiff = Math.abs(findTime - lastTime);
            nextDiff = Math.abs(time - findTime);
            if (prevDiff < nextDiff) {
              return prevDiff;
            } else {
              return nextDiff;
            }
          }
        }
        lastTime = time;
      }
      return lastTime;
    },
    _toggle: function() {
      if (this._playing) {
        return this._pause();
      } else {
        return this._play();
      }
    },
    _prev: function() {
      var prevTime;
      this._pause();
      prevTime = this._nearestEventTime(this.timeline.time, -1);
      this._timeSlider.value = prevTime;
      return this._sliderChanged({
        type: 'change',
        target: {
          value: prevTime
        }
      });
    },
    _pause: function() {
      clearTimeout(this._timer);
      this._playing = false;
      return this.container.classList.remove('playing');
    },
    _play: function() {
      clearTimeout(this._timer);
      if (+this._timeSlider.value === this.end) {
        this._timeSlider.value = this.start;
      }
      this._timeSlider.value = +this._timeSlider.value + this.stepSize;
      this._sliderChanged({
        type: 'change',
        target: {
          value: this._timeSlider.value
        }
      });
      if (+this._timeSlider.value !== this.end) {
        this._playing = true;
        this.container.classList.add('playing');
        return this._timer = setTimeout(this._play.bind(this, this.stepDuration));
      } else {
        this._playing = false;
        return this.container.classList.remove('playing');
      }
    },
    _next: function() {
      var nextTime;
      this._pause();
      nextTime = this._nearestEventTime(this.timeline.time, 1);
      this._timeSlider.value = nextTime;
      return this._sliderChanged({
        type: 'change',
        target: {
          value: nextTime
        }
      });
    },
    _sliderChanged: function(e) {
      var time;
      time = +e.target.value;
      if (!this.timeline.options.waitToUpdateMap || e.type === 'change') {
        this.timeline.setTime(time);
      }
      return this._output.innerHTML = this.timeline.options.formatDate(new Date(time));
    },
    onAdd: function(map1) {
      var buttonContainer, container, sliderCtrlC;
      this.map = map1;
      container = L.DomUtil.create('div', 'leaflet-control-layers ' + 'leaflet-control-layers-expanded ' + 'leaflet-timeline-controls');
      if (this.timeline.options.enablePlayback) {
        sliderCtrlC = L.DomUtil.create('div', 'sldr-ctrl-container', container);
        buttonContainer = L.DomUtil.create('div', 'button-container', sliderCtrlC);
        this._makePlayPause(buttonContainer);
        this._makePrevNext(buttonContainer);
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
      return this.container = container;
    },
    onRemove: function() {
      if (this.timeline.options.enableKeyboardControls) {
        return this._removeKeyListeners();
      }
    }
  });

  L.timeline = function(timedGeoJSON, options) {
    return new L.Timeline(timedGeoJSON, options);
  };

  L.Timeline.timeSliderControl = function(timeline, start, end, timelist) {
    return new L.Timeline.TimeSliderControl(timeline, start, end, timelist);
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,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QXVDLEtBQXZDLEVBQThDLEdBQTlDLEVBQW1ELFFBQW5EO0VBRHlCO0FBdFYvQiIsImZpbGUiOiJsZWFmbGV0LnRpbWVsaW5lLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG5MZWFmbGV0LnRpbWVsaW5lXG5cblNob3cgYW55IGFyYml0cmFyeSBHZW9KU09OIG9iamVjdHMgY2hhbmdpbmcgb3ZlciB0aW1lXG5cbihjKSAyMDE0LTE1IEpvbmF0aGFuIFNrZWF0ZVxuaHR0cHM6Ly9naXRodWIuY29tL3NrZWF0ZS9MZWFmbGV0LnRpbWVsaW5lXG5odHRwOi8vbGVhZmxldGpzLmNvbVxuIyMjXG5cbkwuVGltZWxpbmVWZXJzaW9uID0gJzAuNC4yJ1xuXG4jIGJldHRlciByYW5nZSBsb29rdXAgcGVyZm9ybWFuY2UuXG4jIGh0dHA6Ly9qc3BlcmYuY29tL3JhbmdlLWxvb2t1cC1hbGdvcml0aG0tY29tcGFyaXNvblxuIyBub3Qgc3VyZSBpZiBteSBSQiB0cmVlIGltcGxlbWVudGF0aW9uIHdhcyBmbGF3ZWQgaW4gc29tZSB3YXkgYnV0XG4jIGZvciBzb21lIHJlYXNvbiBhIHBsYWluLCBub24tc2VsZi1iYWxhbmNpbmcgaW50ZXJ2YWwgdHJlZSB3b3JrZWQgYmV0dGVyXG5jbGFzcyBJbnRlcnZhbFRyZWVcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQF9yb290ID0gbnVsbFxuICAgIEBfbGlzdCA9IG51bGxcbiAgaW5zZXJ0OiAoYmVnaW4sIGVuZCwgdmFsdWUsIG5vZGUsIHBhcmVudCwgcGFyZW50U2lkZSkgLT5cbiAgICBpZiBub2RlID09IHVuZGVmaW5lZCB0aGVuIG5vZGUgPSBAX3Jvb3RcbiAgICBpZiAhbm9kZVxuICAgICAgbmV3X25vZGUgPVxuICAgICAgICBsb3c6IGJlZ2luXG4gICAgICAgIGhpZ2g6IGVuZFxuICAgICAgICBtYXg6IGVuZFxuICAgICAgICBkYXRhOiB2YWx1ZVxuICAgICAgICBsZWZ0OiBudWxsXG4gICAgICAgIHJpZ2h0OiBudWxsXG4gICAgICAgIHBhcmVudDogcGFyZW50XG4gICAgICBpZiBwYXJlbnRcbiAgICAgICAgcGFyZW50W3BhcmVudFNpZGVdID0gbmV3X25vZGVcbiAgICAgIGVsc2VcbiAgICAgICAgQF9yb290ID0gbmV3X25vZGVcbiAgICAgIHJldHVybiBuZXdfbm9kZVxuICAgIGVsc2VcbiAgICAgIGlmIGJlZ2luIDwgbm9kZS5sb3cgb3IgYmVnaW4gPT0gbm9kZS5sb3cgYW5kIGVuZCA8IG5vZGUuaGlnaFxuICAgICAgICBuZXdfbm9kZSA9IEBpbnNlcnQgYmVnaW4sIGVuZCwgdmFsdWUsIG5vZGUubGVmdCwgbm9kZSwgJ2xlZnQnXG4gICAgICBlbHNlXG4gICAgICAgIG5ld19ub2RlID0gQGluc2VydCBiZWdpbiwgZW5kLCB2YWx1ZSwgbm9kZS5yaWdodCwgbm9kZSwgJ3JpZ2h0J1xuICAgICAgbm9kZS5tYXggPSBNYXRoLm1heCBub2RlLm1heCwgbmV3X25vZGUubWF4XG4gICAgcmV0dXJuIG5ld19ub2RlXG4gIGxvb2t1cDogKHZhbHVlLCBub2RlKSAtPlxuICAgIGlmIG5vZGUgPT0gdW5kZWZpbmVkXG4gICAgICBub2RlID0gQF9yb290XG4gICAgICBAX2xpc3QgPSBbXVxuICAgIGlmIG5vZGUgPT0gbnVsbCBvciBub2RlLm1heCA8IHZhbHVlIHRoZW4gcmV0dXJuIFtdXG4gICAgaWYgbm9kZS5sZWZ0ICE9IG51bGwgdGhlbiBAbG9va3VwIHZhbHVlLCBub2RlLmxlZnRcbiAgICBpZiBub2RlLmxvdyA8PSB2YWx1ZVxuICAgICAgaWYgbm9kZS5oaWdoID49IHZhbHVlIHRoZW4gQF9saXN0LnB1c2ggbm9kZS5kYXRhXG4gICAgICBAbG9va3VwIHZhbHVlLCBub2RlLnJpZ2h0XG4gICAgcmV0dXJuIEBfbGlzdFxuXG5cbkwuVGltZWxpbmUgPSBMLkdlb0pTT04uZXh0ZW5kXG4gIGluY2x1ZGVzOiBMLk1peGluLkV2ZW50c1xuICB0aW1lczogW11cbiAgZGlzcGxheWVkTGF5ZXJzOiBbXVxuICByYW5nZXM6IG51bGxcbiAgb3B0aW9uczpcbiAgICBwb3NpdGlvbjogXCJib3R0b21sZWZ0XCJcbiAgICBmb3JtYXREYXRlOiAoZGF0ZSkgLT4gXCJcIlxuICAgIGVuYWJsZVBsYXliYWNrOiB0cnVlXG4gICAgZW5hYmxlS2V5Ym9hcmRDb250cm9sczogZmFsc2VcbiAgICBzdGVwczogMTAwMFxuICAgIGR1cmF0aW9uOiAxMDAwMFxuICAgIHNob3dUaWNrczogdHJ1ZVxuICAgIHdhaXRUb1VwZGF0ZU1hcDogZmFsc2VcbiAgaW5pdGlhbGl6ZTogKHRpbWVkR2VvSlNPTiwgb3B0aW9ucykgLT5cbiAgICBAdGltZXMgPSBbXVxuICAgIEwuR2VvSlNPTi5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsIHRoaXMsIHVuZGVmaW5lZCwgb3B0aW9uc1xuICAgIEwuZXh0ZW5kIEBvcHRpb25zLCBvcHRpb25zXG4gICAgQHJhbmdlcyA9IG5ldyBJbnRlcnZhbFRyZWUoKVxuICAgIGlmIG9wdGlvbnMuaW50ZXJ2YWxGcm9tRmVhdHVyZT9cbiAgICAgIEBpbnRlcnZhbEZyb21GZWF0dXJlID0gb3B0aW9ucy5pbnRlcnZhbEZyb21GZWF0dXJlLmJpbmQodGhpcylcbiAgICBpZiBvcHRpb25zLmFkZERhdGE/XG4gICAgICBAYWRkRGF0YSA9IG9wdGlvbnMuYWRkRGF0YS5iaW5kKHRoaXMpXG4gICAgaWYgb3B0aW9ucy5kb1NldFRpbWU/XG4gICAgICBAZG9TZXRUaW1lID0gb3B0aW9ucy5kb1NldFRpbWUuYmluZCh0aGlzKVxuICAgIEBwcm9jZXNzIHRpbWVkR2VvSlNPTiBpZiB0aW1lZEdlb0pTT04/XG5cbiAgaW50ZXJ2YWxGcm9tRmVhdHVyZTogKGZlYXR1cmUpIC0+XG4gICAgc3RhcnQ6ICggbmV3IERhdGUgZmVhdHVyZS5wcm9wZXJ0aWVzLnN0YXJ0ICkuZ2V0VGltZSgpXG4gICAgZW5kOiAoIG5ldyBEYXRlIGZlYXR1cmUucHJvcGVydGllcy5lbmQgKS5nZXRUaW1lKClcblxuICBwcm9jZXNzOiAoZGF0YSkgLT5cbiAgICBlYXJsaWVzdFN0YXJ0ID0gSW5maW5pdHlcbiAgICBsYXRlc3RFbmQgPSAtSW5maW5pdHlcbiAgICBkYXRhLmZlYXR1cmVzLmZvckVhY2ggKGZlYXR1cmUpID0+XG4gICAgICBpbnRlcnZhbCA9IEBpbnRlcnZhbEZyb21GZWF0dXJlKGZlYXR1cmUpXG4gICAgICBAcmFuZ2VzLmluc2VydCBpbnRlcnZhbC5zdGFydCwgaW50ZXJ2YWwuZW5kLCBmZWF0dXJlXG4gICAgICBAdGltZXMucHVzaCBpbnRlcnZhbC5zdGFydFxuICAgICAgQHRpbWVzLnB1c2ggaW50ZXJ2YWwuZW5kXG4gICAgICBpZiBpbnRlcnZhbC5zdGFydCA8IGVhcmxpZXN0U3RhcnQgdGhlbiBlYXJsaWVzdFN0YXJ0ID0gaW50ZXJ2YWwuc3RhcnRcbiAgICAgIGlmIGludGVydmFsLmVuZCA+IGxhdGVzdEVuZCB0aGVuIGxhdGVzdEVuZCA9IGludGVydmFsLmVuZFxuICAgIEB0aW1lcyA9IEB0aW1lcy5zb3J0IChhLCBiKSAtPiBhIC0gYlxuICAgIEB0aW1lcyA9IEB0aW1lcy5yZWR1Y2UoKG5ld0xpc3QsIHgpIC0+XG4gICAgICBpZiBuZXdMaXN0W25ld0xpc3QubGVuZ3RoIC0gMV0gIT0geFxuICAgICAgICBuZXdMaXN0LnB1c2ggeFxuICAgICAgcmV0dXJuIG5ld0xpc3RcbiAgICAsIFtdKVxuICAgIGlmIG5vdCBAb3B0aW9ucy5zdGFydCB0aGVuIEBvcHRpb25zLnN0YXJ0ID0gZWFybGllc3RTdGFydFxuICAgIGlmIG5vdCBAb3B0aW9ucy5lbmQgdGhlbiBAb3B0aW9ucy5lbmQgPSBsYXRlc3RFbmRcblxuICBhZGREYXRhOiAoZ2VvanNvbikgLT5cbiAgICAjIG1vc3RseSBqdXN0IGNvcGllZCBmcm9tIExlYWZsZXQgc291cmNlLCBiZWNhdXNlIHRoZXJlJ3Mgbm8gd2F5IHRvIGdldFxuICAgICMgdGhlIElEIG9mIGFuIGFkZGVkIGxheWVyLiA6KFxuICAgIGZlYXR1cmVzID0gaWYgTC5VdGlsLmlzQXJyYXkgZ2VvanNvbiB0aGVuIGdlb2pzb24gZWxzZSBnZW9qc29uLmZlYXR1cmVzXG4gICAgaWYgZmVhdHVyZXNcbiAgICAgIGZvciBmZWF0dXJlIGluIGZlYXR1cmVzXG4gICAgICAgICMgb25seSBhZGQgdGhpcyBpZiBnZW9tZXRyeSBvciBnZW9tZXRyaWVzIGFyZSBzZXQgYW5kIG5vdCBudWxsXG4gICAgICAgIGlmIGZlYXR1cmUuZ2VvbWV0cmllcyBvciBmZWF0dXJlLmdlb21ldHJ5IG9yIFxcXG4gICAgICAgICAgICBmZWF0dXJlLmZlYXR1cmVzIG9yIGZlYXR1cmUuY29vcmRpbmF0ZXNcbiAgICAgICAgICBAYWRkRGF0YSBmZWF0dXJlXG4gICAgICByZXR1cm4gQFxuICAgIEBfYWRkRGF0YShnZW9qc29uKVxuXG4gIF9hZGREYXRhOiAoZ2VvanNvbikgLT5cbiAgICBvcHRpb25zID0gQG9wdGlvbnNcbiAgICBpZiBvcHRpb25zLmZpbHRlciBhbmQgIW9wdGlvbnMuZmlsdGVyKGdlb2pzb24pIHRoZW4gcmV0dXJuXG4gICAgc2VtdmVyID0gL14oXFxkKykoXFwuKFxcZCspKT8oXFwuKFxcZCspKT8oLSguKikpPyhcXCsoLiopKT8kL1xuICAgIFthLCBtYWpvciwgYiwgbWlub3IsIGMsIHBhdGNoLCBkLCBwcmVyZWxlYXNlLCBlLCBtZXRhXSA9IHNlbXZlci5leGVjIEwudmVyc2lvblxuICAgIGlmIG1ham9yID09IDAgYW5kIG1pbm9yIDw9IDdcbiAgICAgIGxheWVyID0gTC5HZW9KU09OLmdlb21ldHJ5VG9MYXllciBnZW9qc29uLCBvcHRpb25zLnBvaW50VG9MYXllclxuICAgIGVsc2VcbiAgICAgIGxheWVyID0gTC5HZW9KU09OLmdlb21ldHJ5VG9MYXllciBnZW9qc29uLCBvcHRpb25zXG4gICAgIyB0aW1lbGluZSBjdXN0b20gYml0IGhlcmVcbiAgICBAZGlzcGxheWVkTGF5ZXJzLnB1c2hcbiAgICAgIGxheWVyOiBsYXllclxuICAgICAgZ2VvSlNPTjogZ2VvanNvblxuICAgIGxheWVyLmZlYXR1cmUgPSBMLkdlb0pTT04uYXNGZWF0dXJlIGdlb2pzb25cbiAgICBsYXllci5kZWZhdWx0T3B0aW9ucyA9IGxheWVyLm9wdGlvbnNcbiAgICBAcmVzZXRTdHlsZSBsYXllclxuICAgIGlmIG9wdGlvbnMub25FYWNoRmVhdHVyZVxuICAgICAgb3B0aW9ucy5vbkVhY2hGZWF0dXJlIGdlb2pzb24sIGxheWVyXG4gICAgQGFkZExheWVyIGxheWVyXG5cbiAgcmVtb3ZlTGF5ZXI6IChsYXllciwgcmVtb3ZlRGlzcGxheWVkID0gdHJ1ZSkgLT5cbiAgICBMLkdlb0pTT04ucHJvdG90eXBlLnJlbW92ZUxheWVyLmNhbGwgdGhpcywgbGF5ZXJcbiAgICBpZiByZW1vdmVEaXNwbGF5ZWRcbiAgICAgIEBkaXNwbGF5ZWRMYXllcnMgPSBAZGlzcGxheWVkTGF5ZXJzLmZpbHRlciAoZGlzcGxheWVkTGF5ZXIpIC0+XG4gICAgICAgIGRpc3BsYXllZExheWVyLmxheWVyICE9IGxheWVyXG5cblxuICBzZXRUaW1lOiAodGltZSkgLT5cbiAgICBAdGltZSA9IChuZXcgRGF0ZSB0aW1lKS5nZXRUaW1lKClcbiAgICBAZG9TZXRUaW1lKHRpbWUpXG4gICAgQGZpcmUgJ2NoYW5nZSdcblxuICBkb1NldFRpbWU6ICh0aW1lKSAtPlxuICAgIHJhbmdlcyA9IEByYW5nZXMubG9va3VwIHRpbWVcbiAgICAjIGlubGluZSB0aGUgSlMgYmVsb3cgYmVjYXVzZSBtZXNzaW5nIHdpdGggaW5kaWNlc1xuICAgICMgYW5kIHRoYXQncyB1Z2x5IGluIENTXG4gICAgIyBzZWVtcyBsaWtlIGEgdGVycmlibGUgYWxnb3JpdGhtIGJ1dCBJIGRpZCB0ZXN0IGl0OlxuICAgICMgaHR0cDovL2pzcGVyZi5jb20vYXJyYXktaW4tcGxhY2UtcmVwbGFjZVxuICAgICMgc29ydGVkIHdvdWxkIHByb2JhYmx5IGJlIGJldHRlciBpZiBub3QgZm9yIHRoZSBzcGxpY2UgaW5zZXJ0aW9uXG4gICAgIyBtYXliZSB1c2luZyBsaW5rZWQgbGlzdHMgd291bGQgYmUgYmV0dGVyP1xuICAgIGB2YXIgaSwgaiwgZm91bmQ7XG4gICAgZm9yKCBpID0gMDsgaSA8IHRoaXMuZGlzcGxheWVkTGF5ZXJzLmxlbmd0aDsgaSsrICl7XG4gICAgICBmb3VuZCA9IGZhbHNlO1xuICAgICAgZm9yKCBqID0gMDsgaiA8IHJhbmdlcy5sZW5ndGg7IGorKyApe1xuICAgICAgICBpZiggdGhpcy5kaXNwbGF5ZWRMYXllcnNbaV0uZ2VvSlNPTiA9PT0gcmFuZ2VzW2pdICl7XG4gICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgIHJhbmdlcy5zcGxpY2UoaiwgMSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmKCAhZm91bmQgKXtcbiAgICAgICAgdmFyIHRvX3JlbW92ZSA9IHRoaXMuZGlzcGxheWVkTGF5ZXJzLnNwbGljZShpLS0sMSk7XG4gICAgICAgIHRoaXMucmVtb3ZlTGF5ZXIodG9fcmVtb3ZlWzBdLmxheWVyLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGBcbiAgICBmb3IgcmFuZ2UgaW4gcmFuZ2VzXG4gICAgICBAYWRkRGF0YSByYW5nZVxuXG4gIG9uQWRkOiAobWFwKSAtPlxuICAgIEwuR2VvSlNPTi5wcm90b3R5cGUub25BZGQuY2FsbCB0aGlzLCBtYXBcbiAgICBAdGltZVNsaWRlckNvbnRyb2wgPSBMLlRpbWVsaW5lLnRpbWVTbGlkZXJDb250cm9sIHRoaXNcbiAgICBAdGltZVNsaWRlckNvbnRyb2wuYWRkVG8gbWFwXG5cbiAgb25SZW1vdmU6IChtYXApIC0+XG4gICAgTC5HZW9KU09OLnByb3RvdHlwZS5vblJlbW92ZS5jYWxsIHRoaXMsIG1hcFxuICAgIEB0aW1lU2xpZGVyQ29udHJvbC5yZW1vdmVGcm9tIG1hcFxuXG4gIGdldERpc3BsYXllZDogLT4gQHJhbmdlcy5sb29rdXAgQHRpbWVcblxuXG5MLlRpbWVsaW5lLlRpbWVTbGlkZXJDb250cm9sID0gTC5Db250cm9sLmV4dGVuZFxuICBpbml0aWFsaXplOiAoQHRpbWVsaW5lKSAtPlxuICAgIEBvcHRpb25zLnBvc2l0aW9uID0gQHRpbWVsaW5lLm9wdGlvbnMucG9zaXRpb25cbiAgICBAc3RhcnQgPSBAdGltZWxpbmUub3B0aW9ucy5zdGFydFxuICAgIEBlbmQgPSBAdGltZWxpbmUub3B0aW9ucy5lbmRcbiAgICBAc2hvd1RpY2tzID0gQHRpbWVsaW5lLm9wdGlvbnMuc2hvd1RpY2tzXG4gICAgQHN0ZXBEdXJhdGlvbiA9IEB0aW1lbGluZS5vcHRpb25zLmR1cmF0aW9uIC8gQHRpbWVsaW5lLm9wdGlvbnMuc3RlcHNcbiAgICBAc3RlcFNpemUgPSAoIEBlbmQgLSBAc3RhcnQgKSAvIEB0aW1lbGluZS5vcHRpb25zLnN0ZXBzXG5cbiAgX2J1aWxkRGF0YUxpc3Q6IChjb250YWluZXIsIHRpbWVzKSAtPlxuICAgIEBfZGF0YWxpc3QgPSBMLkRvbVV0aWwuY3JlYXRlICdkYXRhbGlzdCcsICcnLCBjb250YWluZXJcbiAgICBkYXRhbGlzdFNlbGVjdCA9IEwuRG9tVXRpbC5jcmVhdGUgJ3NlbGVjdCcsICcnLCBAX2RhdGFsaXN0XG4gICAgdGltZXMuZm9yRWFjaCAodGltZSkgLT5cbiAgICAgIGRhdGFsaXN0T3B0aW9uID0gTC5Eb21VdGlsLmNyZWF0ZSAnb3B0aW9uJywgJycsIGRhdGFsaXN0U2VsZWN0XG4gICAgICBkYXRhbGlzdE9wdGlvbi52YWx1ZSA9IHRpbWVcbiAgICBAX2RhdGFsaXN0LmlkID0gXCJ0aW1lbGluZS1kYXRhbGlzdC1cIiArIE1hdGguZmxvb3IoIE1hdGgucmFuZG9tKCkgKiAxMDAwMDAwIClcbiAgICBAX3RpbWVTbGlkZXIuc2V0QXR0cmlidXRlICdsaXN0JywgQF9kYXRhbGlzdC5pZFxuXG4gIF9tYWtlUGxheVBhdXNlOiAoY29udGFpbmVyKSAtPlxuICAgIEBfcGxheUJ1dHRvbiA9IEwuRG9tVXRpbC5jcmVhdGUgJ2J1dHRvbicsICdwbGF5JywgY29udGFpbmVyXG4gICAgQF9wbGF5QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIgJ2NsaWNrJywgPT4gQF9wbGF5KClcbiAgICBMLkRvbUV2ZW50LmRpc2FibGVDbGlja1Byb3BhZ2F0aW9uIEBfcGxheUJ1dHRvblxuICAgIEBfcGF1c2VCdXR0b24gPSBMLkRvbVV0aWwuY3JlYXRlICdidXR0b24nLCAncGF1c2UnLCBjb250YWluZXJcbiAgICBAX3BhdXNlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIgJ2NsaWNrJywgPT4gQF9wYXVzZSgpXG4gICAgTC5Eb21FdmVudC5kaXNhYmxlQ2xpY2tQcm9wYWdhdGlvbiBAX3BhdXNlQnV0dG9uXG5cbiAgX21ha2VQcmV2TmV4dDogKGNvbnRhaW5lcikgLT5cbiAgICBAX3ByZXZCdXR0b24gPSBMLkRvbVV0aWwuY3JlYXRlICdidXR0b24nLCAncHJldidcbiAgICBAX25leHRCdXR0b24gPSBMLkRvbVV0aWwuY3JlYXRlICdidXR0b24nLCAnbmV4dCdcbiAgICBAX3BsYXlCdXR0b24ucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUgQF9wcmV2QnV0dG9uLCBAX3BsYXlCdXR0b25cbiAgICBAX3BsYXlCdXR0b24ucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUgQF9uZXh0QnV0dG9uLCBAX3BhdXNlQnV0dG9uLm5leHRTaWJsaW5nXG4gICAgTC5Eb21FdmVudC5kaXNhYmxlQ2xpY2tQcm9wYWdhdGlvbiBAX3ByZXZCdXR0b25cbiAgICBMLkRvbUV2ZW50LmRpc2FibGVDbGlja1Byb3BhZ2F0aW9uIEBfbmV4dEJ1dHRvblxuICAgIEBfcHJldkJ1dHRvbi5hZGRFdmVudExpc3RlbmVyICdjbGljaycsIEBfcHJldi5iaW5kIEBcbiAgICBAX25leHRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lciAnY2xpY2snLCBAX25leHQuYmluZCBAXG5cbiAgX21ha2VTbGlkZXI6IChjb250YWluZXIpIC0+XG4gICAgQF90aW1lU2xpZGVyID0gTC5Eb21VdGlsLmNyZWF0ZSAnaW5wdXQnLCAndGltZS1zbGlkZXInLCBjb250YWluZXJcbiAgICBAX3RpbWVTbGlkZXIudHlwZSA9IFwicmFuZ2VcIlxuICAgIEBfdGltZVNsaWRlci5taW4gPSBAc3RhcnRcbiAgICBAX3RpbWVTbGlkZXIubWF4ID0gQGVuZFxuICAgIEBfdGltZVNsaWRlci52YWx1ZSA9IEBzdGFydFxuICAgIEBfdGltZVNsaWRlci5hZGRFdmVudExpc3RlbmVyICdtb3VzZWRvd24nLCA9PiBAbWFwLmRyYWdnaW5nLmRpc2FibGUoKVxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIgICAgICdtb3VzZXVwJywgICA9PiBAbWFwLmRyYWdnaW5nLmVuYWJsZSgpXG4gICAgQF90aW1lU2xpZGVyLmFkZEV2ZW50TGlzdGVuZXIgJ2lucHV0JywgQF9zbGlkZXJDaGFuZ2VkLmJpbmQgQFxuICAgIEBfdGltZVNsaWRlci5hZGRFdmVudExpc3RlbmVyICdjaGFuZ2UnLCBAX3NsaWRlckNoYW5nZWQuYmluZCBAXG5cbiAgX21ha2VPdXRwdXQ6IChjb250YWluZXIpIC0+XG4gICAgQF9vdXRwdXQgPSBMLkRvbVV0aWwuY3JlYXRlICdvdXRwdXQnLCAndGltZS10ZXh0JywgY29udGFpbmVyXG4gICAgQF9vdXRwdXQuaW5uZXJIVE1MID0gQHRpbWVsaW5lLm9wdGlvbnMuZm9ybWF0RGF0ZSBuZXcgRGF0ZSBAc3RhcnRcblxuICBfYWRkS2V5TGlzdGVuZXJzOiAtPlxuICAgIEBfbGlzdGVuZXIgPSBAX29uS2V5ZG93bi5iaW5kIEBcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyICdrZXlkb3duJywgQF9saXN0ZW5lclxuXG4gIF9yZW1vdmVLZXlMaXN0ZW5lcnM6IC0+XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciAna2V5ZG93bicsIEBfbGlzdGVuZXJcblxuICBfb25LZXlkb3duOiAoZSkgLT5cbiAgICBzd2l0Y2ggZS5rZXlDb2RlIG9yIGUud2hpY2hcbiAgICAgIHdoZW4gMzcgdGhlbiBAX3ByZXYoKVxuICAgICAgd2hlbiAzOSB0aGVuIEBfbmV4dCgpXG4gICAgICB3aGVuIDMyIHRoZW4gQF90b2dnbGUoKVxuICAgICAgZWxzZSByZXR1cm5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICBfbmVhcmVzdEV2ZW50VGltZTogKGZpbmRUaW1lLCBtb2RlPTApIC0+XG4gICAgcmV0TmV4dCA9IGZhbHNlXG4gICAgbGFzdFRpbWUgPSBAdGltZWxpbmUudGltZXNbMF1cbiAgICBmb3IgdGltZSBpbiBAdGltZWxpbmUudGltZXNbMS4uXVxuICAgICAgaWYgcmV0TmV4dCB0aGVuIHJldHVybiB0aW1lXG4gICAgICBpZiB0aW1lID49IGZpbmRUaW1lXG4gICAgICAgIGlmIG1vZGUgPT0gLTFcbiAgICAgICAgICByZXR1cm4gbGFzdFRpbWVcbiAgICAgICAgZWxzZSBpZiBtb2RlID09IDFcbiAgICAgICAgICBpZiB0aW1lID09IGZpbmRUaW1lIHRoZW4gcmV0TmV4dCA9IHRydWVcbiAgICAgICAgICBlbHNlIHJldHVybiB0aW1lXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBwcmV2RGlmZiA9IE1hdGguYWJzIGZpbmRUaW1lIC0gbGFzdFRpbWVcbiAgICAgICAgICBuZXh0RGlmZiA9IE1hdGguYWJzIHRpbWUgLSBmaW5kVGltZVxuICAgICAgICAgIHJldHVybiBpZiBwcmV2RGlmZiA8IG5leHREaWZmIHRoZW4gcHJldkRpZmYgZWxzZSBuZXh0RGlmZlxuICAgICAgbGFzdFRpbWUgPSB0aW1lXG4gICAgbGFzdFRpbWVcblxuICBfdG9nZ2xlOiAtPlxuICAgIGlmIEBfcGxheWluZyB0aGVuIEBfcGF1c2UoKSBlbHNlIEBfcGxheSgpXG5cbiAgX3ByZXY6IC0+XG4gICAgQF9wYXVzZSgpXG4gICAgcHJldlRpbWUgPSBAX25lYXJlc3RFdmVudFRpbWUgQHRpbWVsaW5lLnRpbWUsIC0xXG4gICAgQF90aW1lU2xpZGVyLnZhbHVlID0gcHJldlRpbWVcbiAgICBAX3NsaWRlckNoYW5nZWRcbiAgICAgIHR5cGU6ICdjaGFuZ2UnXG4gICAgICB0YXJnZXQ6IHZhbHVlOiBwcmV2VGltZVxuXG4gIF9wYXVzZTogLT5cbiAgICBjbGVhclRpbWVvdXQgQF90aW1lclxuICAgIEBfcGxheWluZyA9IGZhbHNlXG4gICAgQGNvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlICdwbGF5aW5nJ1xuXG4gIF9wbGF5OiAtPlxuICAgIGNsZWFyVGltZW91dCBAX3RpbWVyXG4gICAgaWYgK0BfdGltZVNsaWRlci52YWx1ZSA9PSBAZW5kIHRoZW4gQF90aW1lU2xpZGVyLnZhbHVlID0gQHN0YXJ0XG4gICAgQF90aW1lU2xpZGVyLnZhbHVlID0gK0BfdGltZVNsaWRlci52YWx1ZSArIEBzdGVwU2l6ZVxuICAgIEBfc2xpZGVyQ2hhbmdlZFxuICAgICAgdHlwZTogJ2NoYW5nZSdcbiAgICAgIHRhcmdldDogdmFsdWU6IEBfdGltZVNsaWRlci52YWx1ZVxuICAgIHVubGVzcyArQF90aW1lU2xpZGVyLnZhbHVlID09IEBlbmRcbiAgICAgIEBfcGxheWluZyA9IHRydWVcbiAgICAgIEBjb250YWluZXIuY2xhc3NMaXN0LmFkZCAncGxheWluZydcbiAgICAgIEBfdGltZXIgPSBzZXRUaW1lb3V0IEBfcGxheS5iaW5kIEAsIEBzdGVwRHVyYXRpb25cbiAgICBlbHNlXG4gICAgICBAX3BsYXlpbmcgPSBmYWxzZVxuICAgICAgQGNvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlICdwbGF5aW5nJ1xuXG4gIF9uZXh0OiAtPlxuICAgIEBfcGF1c2UoKVxuICAgIG5leHRUaW1lID0gQF9uZWFyZXN0RXZlbnRUaW1lIEB0aW1lbGluZS50aW1lLCAxXG4gICAgQF90aW1lU2xpZGVyLnZhbHVlID0gbmV4dFRpbWVcbiAgICBAX3NsaWRlckNoYW5nZWRcbiAgICAgIHR5cGU6ICdjaGFuZ2UnXG4gICAgICB0YXJnZXQ6IHZhbHVlOiBuZXh0VGltZVxuXG4gIF9zbGlkZXJDaGFuZ2VkOiAoZSkgLT5cbiAgICB0aW1lID0gK2UudGFyZ2V0LnZhbHVlXG4gICAgaWYgbm90IEB0aW1lbGluZS5vcHRpb25zLndhaXRUb1VwZGF0ZU1hcCBvciBlLnR5cGUgPT0gJ2NoYW5nZSdcbiAgICAgIEB0aW1lbGluZS5zZXRUaW1lIHRpbWVcbiAgICBAX291dHB1dC5pbm5lckhUTUwgPSBAdGltZWxpbmUub3B0aW9ucy5mb3JtYXREYXRlIG5ldyBEYXRlIHRpbWVcblxuICBvbkFkZDogKEBtYXApIC0+XG4gICAgY29udGFpbmVyID0gTC5Eb21VdGlsLmNyZWF0ZSAnZGl2JyxcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWZsZXQtY29udHJvbC1sYXllcnMgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFmbGV0LWNvbnRyb2wtbGF5ZXJzLWV4cGFuZGVkICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhZmxldC10aW1lbGluZS1jb250cm9scydcbiAgICBpZiBAdGltZWxpbmUub3B0aW9ucy5lbmFibGVQbGF5YmFja1xuICAgICAgc2xpZGVyQ3RybEMgPSBMLkRvbVV0aWwuY3JlYXRlICdkaXYnLCAnc2xkci1jdHJsLWNvbnRhaW5lcicsIGNvbnRhaW5lclxuICAgICAgYnV0dG9uQ29udGFpbmVyID0gTC5Eb21VdGlsLmNyZWF0ZSAnZGl2JywgJ2J1dHRvbi1jb250YWluZXInLCBzbGlkZXJDdHJsQ1xuICAgICAgQF9tYWtlUGxheVBhdXNlIGJ1dHRvbkNvbnRhaW5lclxuICAgICAgQF9tYWtlUHJldk5leHQgYnV0dG9uQ29udGFpbmVyXG4gICAgICBpZiBAdGltZWxpbmUub3B0aW9ucy5lbmFibGVLZXlib2FyZENvbnRyb2xzXG4gICAgICAgIEBfYWRkS2V5TGlzdGVuZXJzKClcbiAgICBAX21ha2VTbGlkZXIgY29udGFpbmVyXG4gICAgQF9tYWtlT3V0cHV0IHNsaWRlckN0cmxDXG4gICAgaWYgQHNob3dUaWNrc1xuICAgICAgQF9idWlsZERhdGFMaXN0IGNvbnRhaW5lciwgQHRpbWVsaW5lLnRpbWVzXG4gICAgQHRpbWVsaW5lLnNldFRpbWUgQHN0YXJ0XG4gICAgQGNvbnRhaW5lciA9IGNvbnRhaW5lclxuXG4gIG9uUmVtb3ZlOiAoKSAtPlxuICAgIGlmIEB0aW1lbGluZS5vcHRpb25zLmVuYWJsZUtleWJvYXJkQ29udHJvbHNcbiAgICAgIEBfcmVtb3ZlS2V5TGlzdGVuZXJzKClcblxuTC50aW1lbGluZSA9ICh0aW1lZEdlb0pTT04sIG9wdGlvbnMpIC0+IG5ldyBMLlRpbWVsaW5lIHRpbWVkR2VvSlNPTiwgb3B0aW9uc1xuTC5UaW1lbGluZS50aW1lU2xpZGVyQ29udHJvbCA9ICh0aW1lbGluZSwgc3RhcnQsIGVuZCwgdGltZWxpc3QpIC0+XG4gIG5ldyBMLlRpbWVsaW5lLlRpbWVTbGlkZXJDb250cm9sIHRpbWVsaW5lLCBzdGFydCwgZW5kLCB0aW1lbGlzdFxuIl19
