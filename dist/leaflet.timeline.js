
/*
Leaflet.timeline

Show any arbitrary GeoJSON objects changing over time

(c) 2014-15 Jonathan Skeate
https://github.com/skeate/Leaflet.timeline
http://leafletjs.com
 */

(function() {
  var IntervalTree;

  L.TimelineVersion = '0.4.3';

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

//# sourceMappingURL=data:application/json;base64,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QUFDLFFBQVEsQ0FBQyxpQkFBWCxDQUE2QixRQUE3QixFQUF1QyxLQUF2QyxFQUE4QyxHQUE5QyxFQUFtRCxRQUFuRDtFQUR5QjtBQXRWL0IiLCJmaWxlIjoibGVhZmxldC50aW1lbGluZS5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuTGVhZmxldC50aW1lbGluZVxuXG5TaG93IGFueSBhcmJpdHJhcnkgR2VvSlNPTiBvYmplY3RzIGNoYW5naW5nIG92ZXIgdGltZVxuXG4oYykgMjAxNC0xNSBKb25hdGhhbiBTa2VhdGVcbmh0dHBzOi8vZ2l0aHViLmNvbS9za2VhdGUvTGVhZmxldC50aW1lbGluZVxuaHR0cDovL2xlYWZsZXRqcy5jb21cbiMjI1xuXG5MLlRpbWVsaW5lVmVyc2lvbiA9ICcwLjQuMydcblxuIyBiZXR0ZXIgcmFuZ2UgbG9va3VwIHBlcmZvcm1hbmNlLlxuIyBodHRwOi8vanNwZXJmLmNvbS9yYW5nZS1sb29rdXAtYWxnb3JpdGhtLWNvbXBhcmlzb25cbiMgbm90IHN1cmUgaWYgbXkgUkIgdHJlZSBpbXBsZW1lbnRhdGlvbiB3YXMgZmxhd2VkIGluIHNvbWUgd2F5IGJ1dFxuIyBmb3Igc29tZSByZWFzb24gYSBwbGFpbiwgbm9uLXNlbGYtYmFsYW5jaW5nIGludGVydmFsIHRyZWUgd29ya2VkIGJldHRlclxuY2xhc3MgSW50ZXJ2YWxUcmVlXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBfcm9vdCA9IG51bGxcbiAgICBAX2xpc3QgPSBudWxsXG4gIGluc2VydDogKGJlZ2luLCBlbmQsIHZhbHVlLCBub2RlLCBwYXJlbnQsIHBhcmVudFNpZGUpIC0+XG4gICAgaWYgbm9kZSA9PSB1bmRlZmluZWQgdGhlbiBub2RlID0gQF9yb290XG4gICAgaWYgIW5vZGVcbiAgICAgIG5ld19ub2RlID1cbiAgICAgICAgbG93OiBiZWdpblxuICAgICAgICBoaWdoOiBlbmRcbiAgICAgICAgbWF4OiBlbmRcbiAgICAgICAgZGF0YTogdmFsdWVcbiAgICAgICAgbGVmdDogbnVsbFxuICAgICAgICByaWdodDogbnVsbFxuICAgICAgICBwYXJlbnQ6IHBhcmVudFxuICAgICAgaWYgcGFyZW50XG4gICAgICAgIHBhcmVudFtwYXJlbnRTaWRlXSA9IG5ld19ub2RlXG4gICAgICBlbHNlXG4gICAgICAgIEBfcm9vdCA9IG5ld19ub2RlXG4gICAgICByZXR1cm4gbmV3X25vZGVcbiAgICBlbHNlXG4gICAgICBpZiBiZWdpbiA8IG5vZGUubG93IG9yIGJlZ2luID09IG5vZGUubG93IGFuZCBlbmQgPCBub2RlLmhpZ2hcbiAgICAgICAgbmV3X25vZGUgPSBAaW5zZXJ0IGJlZ2luLCBlbmQsIHZhbHVlLCBub2RlLmxlZnQsIG5vZGUsICdsZWZ0J1xuICAgICAgZWxzZVxuICAgICAgICBuZXdfbm9kZSA9IEBpbnNlcnQgYmVnaW4sIGVuZCwgdmFsdWUsIG5vZGUucmlnaHQsIG5vZGUsICdyaWdodCdcbiAgICAgIG5vZGUubWF4ID0gTWF0aC5tYXggbm9kZS5tYXgsIG5ld19ub2RlLm1heFxuICAgIHJldHVybiBuZXdfbm9kZVxuICBsb29rdXA6ICh2YWx1ZSwgbm9kZSkgLT5cbiAgICBpZiBub2RlID09IHVuZGVmaW5lZFxuICAgICAgbm9kZSA9IEBfcm9vdFxuICAgICAgQF9saXN0ID0gW11cbiAgICBpZiBub2RlID09IG51bGwgb3Igbm9kZS5tYXggPCB2YWx1ZSB0aGVuIHJldHVybiBbXVxuICAgIGlmIG5vZGUubGVmdCAhPSBudWxsIHRoZW4gQGxvb2t1cCB2YWx1ZSwgbm9kZS5sZWZ0XG4gICAgaWYgbm9kZS5sb3cgPD0gdmFsdWVcbiAgICAgIGlmIG5vZGUuaGlnaCA+PSB2YWx1ZSB0aGVuIEBfbGlzdC5wdXNoIG5vZGUuZGF0YVxuICAgICAgQGxvb2t1cCB2YWx1ZSwgbm9kZS5yaWdodFxuICAgIHJldHVybiBAX2xpc3RcblxuXG5MLlRpbWVsaW5lID0gTC5HZW9KU09OLmV4dGVuZFxuICBpbmNsdWRlczogTC5NaXhpbi5FdmVudHNcbiAgdGltZXM6IFtdXG4gIGRpc3BsYXllZExheWVyczogW11cbiAgcmFuZ2VzOiBudWxsXG4gIG9wdGlvbnM6XG4gICAgcG9zaXRpb246IFwiYm90dG9tbGVmdFwiXG4gICAgZm9ybWF0RGF0ZTogKGRhdGUpIC0+IFwiXCJcbiAgICBlbmFibGVQbGF5YmFjazogdHJ1ZVxuICAgIGVuYWJsZUtleWJvYXJkQ29udHJvbHM6IGZhbHNlXG4gICAgc3RlcHM6IDEwMDBcbiAgICBkdXJhdGlvbjogMTAwMDBcbiAgICBzaG93VGlja3M6IHRydWVcbiAgICB3YWl0VG9VcGRhdGVNYXA6IGZhbHNlXG4gIGluaXRpYWxpemU6ICh0aW1lZEdlb0pTT04sIG9wdGlvbnMpIC0+XG4gICAgQHRpbWVzID0gW11cbiAgICBMLkdlb0pTT04ucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCB0aGlzLCB1bmRlZmluZWQsIG9wdGlvbnNcbiAgICBMLmV4dGVuZCBAb3B0aW9ucywgb3B0aW9uc1xuICAgIEByYW5nZXMgPSBuZXcgSW50ZXJ2YWxUcmVlKClcbiAgICBpZiBvcHRpb25zLmludGVydmFsRnJvbUZlYXR1cmU/XG4gICAgICBAaW50ZXJ2YWxGcm9tRmVhdHVyZSA9IG9wdGlvbnMuaW50ZXJ2YWxGcm9tRmVhdHVyZS5iaW5kKHRoaXMpXG4gICAgaWYgb3B0aW9ucy5hZGREYXRhP1xuICAgICAgQGFkZERhdGEgPSBvcHRpb25zLmFkZERhdGEuYmluZCh0aGlzKVxuICAgIGlmIG9wdGlvbnMuZG9TZXRUaW1lP1xuICAgICAgQGRvU2V0VGltZSA9IG9wdGlvbnMuZG9TZXRUaW1lLmJpbmQodGhpcylcbiAgICBAcHJvY2VzcyB0aW1lZEdlb0pTT04gaWYgdGltZWRHZW9KU09OP1xuXG4gIGludGVydmFsRnJvbUZlYXR1cmU6IChmZWF0dXJlKSAtPlxuICAgIHN0YXJ0OiAoIG5ldyBEYXRlIGZlYXR1cmUucHJvcGVydGllcy5zdGFydCApLmdldFRpbWUoKVxuICAgIGVuZDogKCBuZXcgRGF0ZSBmZWF0dXJlLnByb3BlcnRpZXMuZW5kICkuZ2V0VGltZSgpXG5cbiAgcHJvY2VzczogKGRhdGEpIC0+XG4gICAgZWFybGllc3RTdGFydCA9IEluZmluaXR5XG4gICAgbGF0ZXN0RW5kID0gLUluZmluaXR5XG4gICAgZGF0YS5mZWF0dXJlcy5mb3JFYWNoIChmZWF0dXJlKSA9PlxuICAgICAgaW50ZXJ2YWwgPSBAaW50ZXJ2YWxGcm9tRmVhdHVyZShmZWF0dXJlKVxuICAgICAgQHJhbmdlcy5pbnNlcnQgaW50ZXJ2YWwuc3RhcnQsIGludGVydmFsLmVuZCwgZmVhdHVyZVxuICAgICAgQHRpbWVzLnB1c2ggaW50ZXJ2YWwuc3RhcnRcbiAgICAgIEB0aW1lcy5wdXNoIGludGVydmFsLmVuZFxuICAgICAgaWYgaW50ZXJ2YWwuc3RhcnQgPCBlYXJsaWVzdFN0YXJ0IHRoZW4gZWFybGllc3RTdGFydCA9IGludGVydmFsLnN0YXJ0XG4gICAgICBpZiBpbnRlcnZhbC5lbmQgPiBsYXRlc3RFbmQgdGhlbiBsYXRlc3RFbmQgPSBpbnRlcnZhbC5lbmRcbiAgICBAdGltZXMgPSBAdGltZXMuc29ydCAoYSwgYikgLT4gYSAtIGJcbiAgICBAdGltZXMgPSBAdGltZXMucmVkdWNlKChuZXdMaXN0LCB4KSAtPlxuICAgICAgaWYgbmV3TGlzdFtuZXdMaXN0Lmxlbmd0aCAtIDFdICE9IHhcbiAgICAgICAgbmV3TGlzdC5wdXNoIHhcbiAgICAgIHJldHVybiBuZXdMaXN0XG4gICAgLCBbXSlcbiAgICBpZiBub3QgQG9wdGlvbnMuc3RhcnQgdGhlbiBAb3B0aW9ucy5zdGFydCA9IGVhcmxpZXN0U3RhcnRcbiAgICBpZiBub3QgQG9wdGlvbnMuZW5kIHRoZW4gQG9wdGlvbnMuZW5kID0gbGF0ZXN0RW5kXG5cbiAgYWRkRGF0YTogKGdlb2pzb24pIC0+XG4gICAgIyBtb3N0bHkganVzdCBjb3BpZWQgZnJvbSBMZWFmbGV0IHNvdXJjZSwgYmVjYXVzZSB0aGVyZSdzIG5vIHdheSB0byBnZXRcbiAgICAjIHRoZSBJRCBvZiBhbiBhZGRlZCBsYXllci4gOihcbiAgICBmZWF0dXJlcyA9IGlmIEwuVXRpbC5pc0FycmF5IGdlb2pzb24gdGhlbiBnZW9qc29uIGVsc2UgZ2VvanNvbi5mZWF0dXJlc1xuICAgIGlmIGZlYXR1cmVzXG4gICAgICBmb3IgZmVhdHVyZSBpbiBmZWF0dXJlc1xuICAgICAgICAjIG9ubHkgYWRkIHRoaXMgaWYgZ2VvbWV0cnkgb3IgZ2VvbWV0cmllcyBhcmUgc2V0IGFuZCBub3QgbnVsbFxuICAgICAgICBpZiBmZWF0dXJlLmdlb21ldHJpZXMgb3IgZmVhdHVyZS5nZW9tZXRyeSBvciBcXFxuICAgICAgICAgICAgZmVhdHVyZS5mZWF0dXJlcyBvciBmZWF0dXJlLmNvb3JkaW5hdGVzXG4gICAgICAgICAgQGFkZERhdGEgZmVhdHVyZVxuICAgICAgcmV0dXJuIEBcbiAgICBAX2FkZERhdGEoZ2VvanNvbilcblxuICBfYWRkRGF0YTogKGdlb2pzb24pIC0+XG4gICAgb3B0aW9ucyA9IEBvcHRpb25zXG4gICAgaWYgb3B0aW9ucy5maWx0ZXIgYW5kICFvcHRpb25zLmZpbHRlcihnZW9qc29uKSB0aGVuIHJldHVyblxuICAgIHNlbXZlciA9IC9eKFxcZCspKFxcLihcXGQrKSk/KFxcLihcXGQrKSk/KC0oLiopKT8oXFwrKC4qKSk/JC9cbiAgICBbYSwgbWFqb3IsIGIsIG1pbm9yLCBjLCBwYXRjaCwgZCwgcHJlcmVsZWFzZSwgZSwgbWV0YV0gPSBzZW12ZXIuZXhlYyBMLnZlcnNpb25cbiAgICBpZiBwYXJzZUludChtYWpvcikgPT0gMCBhbmQgcGFyc2VJbnQobWlub3IpIDw9IDdcbiAgICAgIGxheWVyID0gTC5HZW9KU09OLmdlb21ldHJ5VG9MYXllciBnZW9qc29uLCBvcHRpb25zLnBvaW50VG9MYXllclxuICAgIGVsc2VcbiAgICAgIGxheWVyID0gTC5HZW9KU09OLmdlb21ldHJ5VG9MYXllciBnZW9qc29uLCBvcHRpb25zXG4gICAgIyB0aW1lbGluZSBjdXN0b20gYml0IGhlcmVcbiAgICBAZGlzcGxheWVkTGF5ZXJzLnB1c2hcbiAgICAgIGxheWVyOiBsYXllclxuICAgICAgZ2VvSlNPTjogZ2VvanNvblxuICAgIGxheWVyLmZlYXR1cmUgPSBMLkdlb0pTT04uYXNGZWF0dXJlIGdlb2pzb25cbiAgICBsYXllci5kZWZhdWx0T3B0aW9ucyA9IGxheWVyLm9wdGlvbnNcbiAgICBAcmVzZXRTdHlsZSBsYXllclxuICAgIGlmIG9wdGlvbnMub25FYWNoRmVhdHVyZVxuICAgICAgb3B0aW9ucy5vbkVhY2hGZWF0dXJlIGdlb2pzb24sIGxheWVyXG4gICAgQGFkZExheWVyIGxheWVyXG5cbiAgcmVtb3ZlTGF5ZXI6IChsYXllciwgcmVtb3ZlRGlzcGxheWVkID0gdHJ1ZSkgLT5cbiAgICBMLkdlb0pTT04ucHJvdG90eXBlLnJlbW92ZUxheWVyLmNhbGwgdGhpcywgbGF5ZXJcbiAgICBpZiByZW1vdmVEaXNwbGF5ZWRcbiAgICAgIEBkaXNwbGF5ZWRMYXllcnMgPSBAZGlzcGxheWVkTGF5ZXJzLmZpbHRlciAoZGlzcGxheWVkTGF5ZXIpIC0+XG4gICAgICAgIGRpc3BsYXllZExheWVyLmxheWVyICE9IGxheWVyXG5cblxuICBzZXRUaW1lOiAodGltZSkgLT5cbiAgICBAdGltZSA9IChuZXcgRGF0ZSB0aW1lKS5nZXRUaW1lKClcbiAgICBAZG9TZXRUaW1lKHRpbWUpXG4gICAgQGZpcmUgJ2NoYW5nZSdcblxuICBkb1NldFRpbWU6ICh0aW1lKSAtPlxuICAgIHJhbmdlcyA9IEByYW5nZXMubG9va3VwIHRpbWVcbiAgICAjIGlubGluZSB0aGUgSlMgYmVsb3cgYmVjYXVzZSBtZXNzaW5nIHdpdGggaW5kaWNlc1xuICAgICMgYW5kIHRoYXQncyB1Z2x5IGluIENTXG4gICAgIyBzZWVtcyBsaWtlIGEgdGVycmlibGUgYWxnb3JpdGhtIGJ1dCBJIGRpZCB0ZXN0IGl0OlxuICAgICMgaHR0cDovL2pzcGVyZi5jb20vYXJyYXktaW4tcGxhY2UtcmVwbGFjZVxuICAgICMgc29ydGVkIHdvdWxkIHByb2JhYmx5IGJlIGJldHRlciBpZiBub3QgZm9yIHRoZSBzcGxpY2UgaW5zZXJ0aW9uXG4gICAgIyBtYXliZSB1c2luZyBsaW5rZWQgbGlzdHMgd291bGQgYmUgYmV0dGVyP1xuICAgIGB2YXIgaSwgaiwgZm91bmQ7XG4gICAgZm9yKCBpID0gMDsgaSA8IHRoaXMuZGlzcGxheWVkTGF5ZXJzLmxlbmd0aDsgaSsrICl7XG4gICAgICBmb3VuZCA9IGZhbHNlO1xuICAgICAgZm9yKCBqID0gMDsgaiA8IHJhbmdlcy5sZW5ndGg7IGorKyApe1xuICAgICAgICBpZiggdGhpcy5kaXNwbGF5ZWRMYXllcnNbaV0uZ2VvSlNPTiA9PT0gcmFuZ2VzW2pdICl7XG4gICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgIHJhbmdlcy5zcGxpY2UoaiwgMSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmKCAhZm91bmQgKXtcbiAgICAgICAgdmFyIHRvX3JlbW92ZSA9IHRoaXMuZGlzcGxheWVkTGF5ZXJzLnNwbGljZShpLS0sMSk7XG4gICAgICAgIHRoaXMucmVtb3ZlTGF5ZXIodG9fcmVtb3ZlWzBdLmxheWVyLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGBcbiAgICBmb3IgcmFuZ2UgaW4gcmFuZ2VzXG4gICAgICBAYWRkRGF0YSByYW5nZVxuXG4gIG9uQWRkOiAobWFwKSAtPlxuICAgIEwuR2VvSlNPTi5wcm90b3R5cGUub25BZGQuY2FsbCB0aGlzLCBtYXBcbiAgICBAdGltZVNsaWRlckNvbnRyb2wgPSBMLlRpbWVsaW5lLnRpbWVTbGlkZXJDb250cm9sIHRoaXNcbiAgICBAdGltZVNsaWRlckNvbnRyb2wuYWRkVG8gbWFwXG5cbiAgb25SZW1vdmU6IChtYXApIC0+XG4gICAgTC5HZW9KU09OLnByb3RvdHlwZS5vblJlbW92ZS5jYWxsIHRoaXMsIG1hcFxuICAgIEB0aW1lU2xpZGVyQ29udHJvbC5yZW1vdmVGcm9tIG1hcFxuXG4gIGdldERpc3BsYXllZDogLT4gQHJhbmdlcy5sb29rdXAgQHRpbWVcblxuXG5MLlRpbWVsaW5lLlRpbWVTbGlkZXJDb250cm9sID0gTC5Db250cm9sLmV4dGVuZFxuICBpbml0aWFsaXplOiAoQHRpbWVsaW5lKSAtPlxuICAgIEBvcHRpb25zLnBvc2l0aW9uID0gQHRpbWVsaW5lLm9wdGlvbnMucG9zaXRpb25cbiAgICBAc3RhcnQgPSBAdGltZWxpbmUub3B0aW9ucy5zdGFydFxuICAgIEBlbmQgPSBAdGltZWxpbmUub3B0aW9ucy5lbmRcbiAgICBAc2hvd1RpY2tzID0gQHRpbWVsaW5lLm9wdGlvbnMuc2hvd1RpY2tzXG4gICAgQHN0ZXBEdXJhdGlvbiA9IEB0aW1lbGluZS5vcHRpb25zLmR1cmF0aW9uIC8gQHRpbWVsaW5lLm9wdGlvbnMuc3RlcHNcbiAgICBAc3RlcFNpemUgPSAoIEBlbmQgLSBAc3RhcnQgKSAvIEB0aW1lbGluZS5vcHRpb25zLnN0ZXBzXG5cbiAgX2J1aWxkRGF0YUxpc3Q6IChjb250YWluZXIsIHRpbWVzKSAtPlxuICAgIEBfZGF0YWxpc3QgPSBMLkRvbVV0aWwuY3JlYXRlICdkYXRhbGlzdCcsICcnLCBjb250YWluZXJcbiAgICBkYXRhbGlzdFNlbGVjdCA9IEwuRG9tVXRpbC5jcmVhdGUgJ3NlbGVjdCcsICcnLCBAX2RhdGFsaXN0XG4gICAgdGltZXMuZm9yRWFjaCAodGltZSkgLT5cbiAgICAgIGRhdGFsaXN0T3B0aW9uID0gTC5Eb21VdGlsLmNyZWF0ZSAnb3B0aW9uJywgJycsIGRhdGFsaXN0U2VsZWN0XG4gICAgICBkYXRhbGlzdE9wdGlvbi52YWx1ZSA9IHRpbWVcbiAgICBAX2RhdGFsaXN0LmlkID0gXCJ0aW1lbGluZS1kYXRhbGlzdC1cIiArIE1hdGguZmxvb3IoIE1hdGgucmFuZG9tKCkgKiAxMDAwMDAwIClcbiAgICBAX3RpbWVTbGlkZXIuc2V0QXR0cmlidXRlICdsaXN0JywgQF9kYXRhbGlzdC5pZFxuXG4gIF9tYWtlUGxheVBhdXNlOiAoY29udGFpbmVyKSAtPlxuICAgIEBfcGxheUJ1dHRvbiA9IEwuRG9tVXRpbC5jcmVhdGUgJ2J1dHRvbicsICdwbGF5JywgY29udGFpbmVyXG4gICAgQF9wbGF5QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIgJ2NsaWNrJywgPT4gQF9wbGF5KClcbiAgICBMLkRvbUV2ZW50LmRpc2FibGVDbGlja1Byb3BhZ2F0aW9uIEBfcGxheUJ1dHRvblxuICAgIEBfcGF1c2VCdXR0b24gPSBMLkRvbVV0aWwuY3JlYXRlICdidXR0b24nLCAncGF1c2UnLCBjb250YWluZXJcbiAgICBAX3BhdXNlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIgJ2NsaWNrJywgPT4gQF9wYXVzZSgpXG4gICAgTC5Eb21FdmVudC5kaXNhYmxlQ2xpY2tQcm9wYWdhdGlvbiBAX3BhdXNlQnV0dG9uXG5cbiAgX21ha2VQcmV2TmV4dDogKGNvbnRhaW5lcikgLT5cbiAgICBAX3ByZXZCdXR0b24gPSBMLkRvbVV0aWwuY3JlYXRlICdidXR0b24nLCAncHJldidcbiAgICBAX25leHRCdXR0b24gPSBMLkRvbVV0aWwuY3JlYXRlICdidXR0b24nLCAnbmV4dCdcbiAgICBAX3BsYXlCdXR0b24ucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUgQF9wcmV2QnV0dG9uLCBAX3BsYXlCdXR0b25cbiAgICBAX3BsYXlCdXR0b24ucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUgQF9uZXh0QnV0dG9uLCBAX3BhdXNlQnV0dG9uLm5leHRTaWJsaW5nXG4gICAgTC5Eb21FdmVudC5kaXNhYmxlQ2xpY2tQcm9wYWdhdGlvbiBAX3ByZXZCdXR0b25cbiAgICBMLkRvbUV2ZW50LmRpc2FibGVDbGlja1Byb3BhZ2F0aW9uIEBfbmV4dEJ1dHRvblxuICAgIEBfcHJldkJ1dHRvbi5hZGRFdmVudExpc3RlbmVyICdjbGljaycsIEBfcHJldi5iaW5kIEBcbiAgICBAX25leHRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lciAnY2xpY2snLCBAX25leHQuYmluZCBAXG5cbiAgX21ha2VTbGlkZXI6IChjb250YWluZXIpIC0+XG4gICAgQF90aW1lU2xpZGVyID0gTC5Eb21VdGlsLmNyZWF0ZSAnaW5wdXQnLCAndGltZS1zbGlkZXInLCBjb250YWluZXJcbiAgICBAX3RpbWVTbGlkZXIudHlwZSA9IFwicmFuZ2VcIlxuICAgIEBfdGltZVNsaWRlci5taW4gPSBAc3RhcnRcbiAgICBAX3RpbWVTbGlkZXIubWF4ID0gQGVuZFxuICAgIEBfdGltZVNsaWRlci52YWx1ZSA9IEBzdGFydFxuICAgIEBfdGltZVNsaWRlci5hZGRFdmVudExpc3RlbmVyICdtb3VzZWRvd24nLCA9PiBAbWFwLmRyYWdnaW5nLmRpc2FibGUoKVxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIgICAgICdtb3VzZXVwJywgICA9PiBAbWFwLmRyYWdnaW5nLmVuYWJsZSgpXG4gICAgQF90aW1lU2xpZGVyLmFkZEV2ZW50TGlzdGVuZXIgJ2lucHV0JywgQF9zbGlkZXJDaGFuZ2VkLmJpbmQgQFxuICAgIEBfdGltZVNsaWRlci5hZGRFdmVudExpc3RlbmVyICdjaGFuZ2UnLCBAX3NsaWRlckNoYW5nZWQuYmluZCBAXG5cbiAgX21ha2VPdXRwdXQ6IChjb250YWluZXIpIC0+XG4gICAgQF9vdXRwdXQgPSBMLkRvbVV0aWwuY3JlYXRlICdvdXRwdXQnLCAndGltZS10ZXh0JywgY29udGFpbmVyXG4gICAgQF9vdXRwdXQuaW5uZXJIVE1MID0gQHRpbWVsaW5lLm9wdGlvbnMuZm9ybWF0RGF0ZSBuZXcgRGF0ZSBAc3RhcnRcblxuICBfYWRkS2V5TGlzdGVuZXJzOiAtPlxuICAgIEBfbGlzdGVuZXIgPSBAX29uS2V5ZG93bi5iaW5kIEBcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyICdrZXlkb3duJywgQF9saXN0ZW5lclxuXG4gIF9yZW1vdmVLZXlMaXN0ZW5lcnM6IC0+XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciAna2V5ZG93bicsIEBfbGlzdGVuZXJcblxuICBfb25LZXlkb3duOiAoZSkgLT5cbiAgICBzd2l0Y2ggZS5rZXlDb2RlIG9yIGUud2hpY2hcbiAgICAgIHdoZW4gMzcgdGhlbiBAX3ByZXYoKVxuICAgICAgd2hlbiAzOSB0aGVuIEBfbmV4dCgpXG4gICAgICB3aGVuIDMyIHRoZW4gQF90b2dnbGUoKVxuICAgICAgZWxzZSByZXR1cm5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICBfbmVhcmVzdEV2ZW50VGltZTogKGZpbmRUaW1lLCBtb2RlPTApIC0+XG4gICAgcmV0TmV4dCA9IGZhbHNlXG4gICAgbGFzdFRpbWUgPSBAdGltZWxpbmUudGltZXNbMF1cbiAgICBmb3IgdGltZSBpbiBAdGltZWxpbmUudGltZXNbMS4uXVxuICAgICAgaWYgcmV0TmV4dCB0aGVuIHJldHVybiB0aW1lXG4gICAgICBpZiB0aW1lID49IGZpbmRUaW1lXG4gICAgICAgIGlmIG1vZGUgPT0gLTFcbiAgICAgICAgICByZXR1cm4gbGFzdFRpbWVcbiAgICAgICAgZWxzZSBpZiBtb2RlID09IDFcbiAgICAgICAgICBpZiB0aW1lID09IGZpbmRUaW1lIHRoZW4gcmV0TmV4dCA9IHRydWVcbiAgICAgICAgICBlbHNlIHJldHVybiB0aW1lXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBwcmV2RGlmZiA9IE1hdGguYWJzIGZpbmRUaW1lIC0gbGFzdFRpbWVcbiAgICAgICAgICBuZXh0RGlmZiA9IE1hdGguYWJzIHRpbWUgLSBmaW5kVGltZVxuICAgICAgICAgIHJldHVybiBpZiBwcmV2RGlmZiA8IG5leHREaWZmIHRoZW4gcHJldkRpZmYgZWxzZSBuZXh0RGlmZlxuICAgICAgbGFzdFRpbWUgPSB0aW1lXG4gICAgbGFzdFRpbWVcblxuICBfdG9nZ2xlOiAtPlxuICAgIGlmIEBfcGxheWluZyB0aGVuIEBfcGF1c2UoKSBlbHNlIEBfcGxheSgpXG5cbiAgX3ByZXY6IC0+XG4gICAgQF9wYXVzZSgpXG4gICAgcHJldlRpbWUgPSBAX25lYXJlc3RFdmVudFRpbWUgQHRpbWVsaW5lLnRpbWUsIC0xXG4gICAgQF90aW1lU2xpZGVyLnZhbHVlID0gcHJldlRpbWVcbiAgICBAX3NsaWRlckNoYW5nZWRcbiAgICAgIHR5cGU6ICdjaGFuZ2UnXG4gICAgICB0YXJnZXQ6IHZhbHVlOiBwcmV2VGltZVxuXG4gIF9wYXVzZTogLT5cbiAgICBjbGVhclRpbWVvdXQgQF90aW1lclxuICAgIEBfcGxheWluZyA9IGZhbHNlXG4gICAgQGNvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlICdwbGF5aW5nJ1xuXG4gIF9wbGF5OiAtPlxuICAgIGNsZWFyVGltZW91dCBAX3RpbWVyXG4gICAgaWYgK0BfdGltZVNsaWRlci52YWx1ZSA9PSBAZW5kIHRoZW4gQF90aW1lU2xpZGVyLnZhbHVlID0gQHN0YXJ0XG4gICAgQF90aW1lU2xpZGVyLnZhbHVlID0gK0BfdGltZVNsaWRlci52YWx1ZSArIEBzdGVwU2l6ZVxuICAgIEBfc2xpZGVyQ2hhbmdlZFxuICAgICAgdHlwZTogJ2NoYW5nZSdcbiAgICAgIHRhcmdldDogdmFsdWU6IEBfdGltZVNsaWRlci52YWx1ZVxuICAgIHVubGVzcyArQF90aW1lU2xpZGVyLnZhbHVlID09IEBlbmRcbiAgICAgIEBfcGxheWluZyA9IHRydWVcbiAgICAgIEBjb250YWluZXIuY2xhc3NMaXN0LmFkZCAncGxheWluZydcbiAgICAgIEBfdGltZXIgPSBzZXRUaW1lb3V0IEBfcGxheS5iaW5kIEAsIEBzdGVwRHVyYXRpb25cbiAgICBlbHNlXG4gICAgICBAX3BsYXlpbmcgPSBmYWxzZVxuICAgICAgQGNvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlICdwbGF5aW5nJ1xuXG4gIF9uZXh0OiAtPlxuICAgIEBfcGF1c2UoKVxuICAgIG5leHRUaW1lID0gQF9uZWFyZXN0RXZlbnRUaW1lIEB0aW1lbGluZS50aW1lLCAxXG4gICAgQF90aW1lU2xpZGVyLnZhbHVlID0gbmV4dFRpbWVcbiAgICBAX3NsaWRlckNoYW5nZWRcbiAgICAgIHR5cGU6ICdjaGFuZ2UnXG4gICAgICB0YXJnZXQ6IHZhbHVlOiBuZXh0VGltZVxuXG4gIF9zbGlkZXJDaGFuZ2VkOiAoZSkgLT5cbiAgICB0aW1lID0gK2UudGFyZ2V0LnZhbHVlXG4gICAgaWYgbm90IEB0aW1lbGluZS5vcHRpb25zLndhaXRUb1VwZGF0ZU1hcCBvciBlLnR5cGUgPT0gJ2NoYW5nZSdcbiAgICAgIEB0aW1lbGluZS5zZXRUaW1lIHRpbWVcbiAgICBAX291dHB1dC5pbm5lckhUTUwgPSBAdGltZWxpbmUub3B0aW9ucy5mb3JtYXREYXRlIG5ldyBEYXRlIHRpbWVcblxuICBvbkFkZDogKEBtYXApIC0+XG4gICAgY29udGFpbmVyID0gTC5Eb21VdGlsLmNyZWF0ZSAnZGl2JyxcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWZsZXQtY29udHJvbC1sYXllcnMgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFmbGV0LWNvbnRyb2wtbGF5ZXJzLWV4cGFuZGVkICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhZmxldC10aW1lbGluZS1jb250cm9scydcbiAgICBpZiBAdGltZWxpbmUub3B0aW9ucy5lbmFibGVQbGF5YmFja1xuICAgICAgc2xpZGVyQ3RybEMgPSBMLkRvbVV0aWwuY3JlYXRlICdkaXYnLCAnc2xkci1jdHJsLWNvbnRhaW5lcicsIGNvbnRhaW5lclxuICAgICAgYnV0dG9uQ29udGFpbmVyID0gTC5Eb21VdGlsLmNyZWF0ZSAnZGl2JywgJ2J1dHRvbi1jb250YWluZXInLCBzbGlkZXJDdHJsQ1xuICAgICAgQF9tYWtlUGxheVBhdXNlIGJ1dHRvbkNvbnRhaW5lclxuICAgICAgQF9tYWtlUHJldk5leHQgYnV0dG9uQ29udGFpbmVyXG4gICAgICBpZiBAdGltZWxpbmUub3B0aW9ucy5lbmFibGVLZXlib2FyZENvbnRyb2xzXG4gICAgICAgIEBfYWRkS2V5TGlzdGVuZXJzKClcbiAgICBAX21ha2VTbGlkZXIgY29udGFpbmVyXG4gICAgQF9tYWtlT3V0cHV0IHNsaWRlckN0cmxDXG4gICAgaWYgQHNob3dUaWNrc1xuICAgICAgQF9idWlsZERhdGFMaXN0IGNvbnRhaW5lciwgQHRpbWVsaW5lLnRpbWVzXG4gICAgQHRpbWVsaW5lLnNldFRpbWUgQHN0YXJ0XG4gICAgQGNvbnRhaW5lciA9IGNvbnRhaW5lclxuXG4gIG9uUmVtb3ZlOiAoKSAtPlxuICAgIGlmIEB0aW1lbGluZS5vcHRpb25zLmVuYWJsZUtleWJvYXJkQ29udHJvbHNcbiAgICAgIEBfcmVtb3ZlS2V5TGlzdGVuZXJzKClcblxuTC50aW1lbGluZSA9ICh0aW1lZEdlb0pTT04sIG9wdGlvbnMpIC0+IG5ldyBMLlRpbWVsaW5lIHRpbWVkR2VvSlNPTiwgb3B0aW9uc1xuTC5UaW1lbGluZS50aW1lU2xpZGVyQ29udHJvbCA9ICh0aW1lbGluZSwgc3RhcnQsIGVuZCwgdGltZWxpc3QpIC0+XG4gIG5ldyBMLlRpbWVsaW5lLlRpbWVTbGlkZXJDb250cm9sIHRpbWVsaW5lLCBzdGFydCwgZW5kLCB0aW1lbGlzdFxuIl19
