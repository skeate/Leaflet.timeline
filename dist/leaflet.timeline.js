/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	/* global require, L */
	
	L.TimelineVersion = '1.0.0-beta';
	
	__webpack_require__(1);
	__webpack_require__(3);
	
	// webpack requires
	__webpack_require__(4);

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })(); /* global L */
	
	var _IntervalTree = __webpack_require__(2);
	
	var _IntervalTree2 = _interopRequireDefault(_IntervalTree);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	L.Timeline = L.GeoJSON.extend({
	  times: [],
	  displayedLayers: [],
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
	  initialize: function initialize(geojson) {
	    var _this = this;
	
	    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
	
	    // Some functionality was changed after Leaflet 0.7; some people use the
	    // latest stable, some use the beta. This should work either way, so we need
	    // a version check.
	    this.ranges = new _IntervalTree2.default();
	    var semver = /^(\d+)(\.(\d+))?(\.(\d+))?(-(.*))?(\+(.*))?$/;
	
	    var _semver$exec = semver.exec(L.version);
	
	    var _semver$exec2 = _slicedToArray(_semver$exec, 4);
	
	    var major = _semver$exec2[1];
	    var minor = _semver$exec2[3];
	
	    this.isOldVersion = parseInt(major, 10) === 0 && parseInt(minor, 10) <= 7;
	    var defaultOptions = {
	      drawOnSetTime: true
	    };
	    L.GeoJSON.prototype.initialize.call(this, null, options);
	    L.Util.setOptions(this, defaultOptions);
	    L.Util.setOptions(this, options);
	    if (this.options.getInterval) {
	      this._getInterval = function () {
	        var _options;
	
	        return (_options = _this.options).getInterval.apply(_options, arguments);
	      };
	    }
	    if (geojson) {
	      this._process(geojson);
	    }
	  },
	  _getInterval: function _getInterval(feature) {
	    return {
	      start: new Date(feature.properties.start).getTime(),
	      end: new Date(feature.properties.end).getTime()
	    };
	  },
	
	  /**
	   * Finds the first and last times in the dataset, adds all times into an
	   * array, and puts everything into an IntervalTree for quick lookup.
	   *
	   * @param {Object} data GeoJSON to process
	   */
	  _process: function _process(data) {
	    var _this2 = this;
	
	    // In case we don't have a manually set start or end time, we need to find
	    // the extremes in the data. We can do that while we're inserting everything
	    // into the interval tree.
	    var start = Infinity;
	    var end = -Infinity;
	    data.features.forEach(function (feature) {
	      var interval = _this2._getInterval(feature);
	      _this2.ranges.insert(interval.start, interval.end, feature);
	      _this2.times.push(interval.start);
	      _this2.times.push(interval.end);
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
	    this.times.sort(function (a, b) {
	      return a - b;
	    });
	    // de-duplicate the times
	    this.times = this.times.reduce(function (newList, x, i) {
	      if (i === 0) {
	        return newList;
	      }
	      var lastTime = newList[newList.length - 1];
	      if (lastTime !== x) {
	        newList.push(x);
	      }
	      return newList;
	    }, [this.times[0]]);
	  },
	
	  /**
	   * Overrides `L.GeoJSON`'s addData. Largely copy/paste (with some ES2015
	   * conversion), but the key difference is that this will also track the layers
	   * that have been added.
	   *
	   * @param {Object[]|Object} geojson A GeoJSON object or array of GeoJSON
	   * objects.
	   * @returns {L.Timeline} `this`
	   */
	  addData: function addData(geojson) {
	    var _this3 = this;
	
	    var features = L.Util.isArray(geojson) ? geojson : geojson.features;
	    if (features) {
	      features.filter(function (f) {
	        return f.geometries || f.geometry || f.features || f.coordinates;
	      }).forEach(function (feature) {
	        return _this3.addData(feature);
	      });
	      return this;
	    }
	    if (this.options.filter && !this.options.filter(geojson)) {
	      return this;
	    }
	    var layer = L.GeoJSON.geometryToLayer(geojson, this.isOldVersion ? this.options.pointToLayer : this.options);
	    if (!layer) {
	      return this;
	    }
	    // *** this is the main custom part, here ***
	    this.displayedLayers.push({ layer: layer, geoJSON: geojson });
	    // *** end custom bit. wasn't that useful? ***
	    layer.feature = L.GeoJSON.asFeature(geojson);
	    layer.defaultOptions = layer.options;
	    this.resetStyle(layer);
	    if (this.options.onEachFeature) {
	      this.options.onEachFeature(geojson, layer);
	    }
	    this.addLayer(layer);
	  },
	
	  /**
	   * Removes a layer, optionally also removing it from the `displayedLayers`
	   * array.
	   *
	   * @param {L.Layer} layer The layer to remove
	   * @param {Boolean} [removeDisplayed] Also remove from `displayedLayers`
	   */
	  removeLayer: function removeLayer(layer) {
	    var removeDisplayed = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];
	
	    L.GeoJSON.prototype.removeLayer.call(this, layer);
	    if (removeDisplayed) {
	      this.displayedLayers = this.displayedLayers.filter(function (displayedLayer) {
	        return displayedLayer.layer !== layer;
	      });
	    }
	  },
	
	  /**
	   * Sets the time for this layer.
	   *
	   * @param {Number|String} time The time to set. Usually a number, but if your
	   * data is really time-based then you can pass a string (e.g. '2015-01-01')
	   * and it will be processed into a number automatically.
	   */
	  setTime: function setTime(time) {
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
	  updateDisplayedLayers: function updateDisplayedLayers() {
	    var _this4 = this;
	
	    // This loop is intended to help optimize things a bit. First, we find all
	    // the features that should be displayed at the current time.
	    var features = this.ranges.lookup(this.time);
	    // Then we try to match each currently displayed layer up to a feature. If
	    // we find a match, then we remove it from the feature list. If we don't
	    // find a match, then the displayed layer is no longer valid at this time.
	    // We should remove it.
	    for (var i = 0; i < this.displayedLayers.length; i++) {
	      var found = false;
	      for (var j = 0; j < features.length; j++) {
	        if (this.displayedLayers[i].geoJSON === features[j]) {
	          found = true;
	          features.splice(j, 1);
	          break;
	        }
	      }
	      if (!found) {
	        var toRemove = this.displayedLayers.splice(i--, 1);
	        this.removeLayer(toRemove[0].layer, false);
	      }
	    }
	    // Finally, with any features left, they must be new data! We can add them.
	    features.forEach(function (feature) {
	      return _this4.addData(feature);
	    });
	  },
	  getDisplayed: function getDisplayed() {
	    return this.displayedLayers.map(function (layer) {
	      return layer.geoJSON;
	    });
	  }
	});
	
	L.timeline = function (geojson, options) {
	  return new L.Timeline(geojson, options);
	};

/***/ },
/* 2 */
/***/ function(module, exports) {

	'use strict';
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	/**
	 * A node in the interval tree.
	 *
	 * @property {Number} low Start of the interval
	 * @property {Number} high End of the interval
	 * @property {Number} max The greatest endpoint of this node's interval or any
	 * of its children.
	 * @property {*} data The value of the interval
	 * @property {IntervalTreeNode?} left Left child (lower intervals)
	 * @property {IntervalTreeNode?} right Right child (higher intervals)
	 * @property {IntervalTreeNode?} parent The parent of this node
	 * @private
	 */
	
	var IntervalTreeNode = function IntervalTreeNode(low, high, data, parent) {
	  _classCallCheck(this, IntervalTreeNode);
	
	  this.low = low;
	  this.high = high;
	  this.max = high;
	  this.data = data;
	  this.left = null;
	  this.right = null;
	  this.parent = parent;
	};
	
	var IntervalTree = (function () {
	  function IntervalTree() {
	    _classCallCheck(this, IntervalTree);
	
	    this._root = null;
	    this.size = 0;
	  }
	
	  /**
	   * Actually insert a new interval into the tree. This has a few extra
	   * arguments that don't really need to be exposed in the public API, hence the
	   * separation.
	   *
	   * @private
	   * @param {Number} begin Start of the interval
	   * @param {Number} end End of the interval
	   * @param {*} value The value of the interval
	   * @param {IntervalTreeNode?} node The current place we are looking at to add
	   * the interval
	   * @param {IntervalTreeNode?} parent The parent of the place we are looking to
	   * add the interval
	   * @param {String} parentSide The side of the parent we're looking at
	   * @returns {IntervalTreeNode} The newly added node
	   */
	
	  _createClass(IntervalTree, [{
	    key: '_insert',
	    value: function _insert(begin, end, value, node, parent, parentSide) {
	      var newNode = undefined;
	      if (node === null) {
	        // The place we're looking at is available; let's put our node here.
	        newNode = new IntervalTreeNode(begin, end, value, parent);
	        if (parent === null) {
	          // No parent? Must be root.
	          this._root = newNode;
	        } else {
	          // Let the parent know about its new child
	          parent[parentSide] = newNode;
	        }
	      } else {
	        // No vacancies. Figure out which side we should be putting our interval,
	        // and then recurse.
	        var side = begin < node.low || begin === node.low && end < node.high ? 'left' : 'right';
	        newNode = this._insert(begin, end, value, node[side], node, side);
	        node.max = Math.max(node.max, newNode.max);
	      }
	      return newNode;
	    }
	
	    /**
	     * Insert a new value into the tree, for the given interval.
	     *
	     * @param {Number} begin The start of the valid interval
	     * @param {Number} end The end of the valid interval
	     * @param {*} value The value for the interval
	     */
	
	  }, {
	    key: 'insert',
	    value: function insert(begin, end, value) {
	      this._insert(begin, end, value, this._root, this._root);
	      this.size++;
	    }
	
	    /**
	     * Find all intervals that cover a certain point.
	     *
	     * @param {Number} point The sought point
	     * @returns {*[]} An array of all values that are valid at the given point.
	     */
	
	  }, {
	    key: 'lookup',
	    value: function lookup(point) {
	      var overlaps = [];
	      var node = this._root;
	      if (arguments.length === 2) {
	        node = arguments[1];
	      }
	      if (node === null || node.max < point) {
	        return overlaps;
	      }
	      overlaps.push.apply(overlaps, _toConsumableArray(this.lookup(point, node.left)));
	      if (node.low <= point) {
	        if (node.high >= point) {
	          overlaps.push(node.data);
	        }
	        overlaps.push.apply(overlaps, _toConsumableArray(this.lookup(point, node.right)));
	      }
	      return overlaps;
	    }
	  }]);
	
	  return IntervalTree;
	})();
	
	exports.default = IntervalTree;

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';
	
	function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }
	
	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }
	
	/* global L */
	
	/*
	 * @class
	 * @extends L.Control
	 */
	L.TimelineSliderControl = L.Control.extend({
	  /**
	   * @constructor
	   * @param {Number} [options.duration=600000] The amount of time a complete
	   * playback should take. Not guaranteed; if there's a lot of data or
	   * complicated rendering, it will likely wind up taking longer.
	   * @param {Boolean} [options.enableKeyboardControls=false] Allow playback to
	   * be controlled using the spacebar (play/pause) and right/left arrow keys
	   * (next/previous).
	   * @param {Boolean} [options.enablePlayback=true] Show playback controls (i.e.
	   * prev/play/pause/next).
	   * @param {Function} [options.formatOutput] A function which takes the current
	   * time value (usually a Unix timestamp) and outputs a string that is
	   * displayed beneath the control buttons.
	   * @param {Boolean} [options.showTicks=true] Show ticks on the timeline (if
	   * the browser supports it).
	   * @param {Boolean} [options.waitToUpdateMap=false] Wait until the user is
	   * finished changing the date to update the map. By default, both the map and
	   * the date update for every change. With complex data, this can slow things
	   * down, so set this to true to only update the displayed date.
	   * @param {Number} [options.start] The start time of the timeline. If unset,
	   * this will be calculated automatically based on the timelines registered to
	   * this control.
	   * @param {Number} [options.end] The end time of the timeline. If unset, this
	   * will be calculated automatically based on the timelines registered to this
	   * control.
	   */
	
	  initialize: function initialize() {
	    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
	
	    var defaultOptions = {
	      duration: 10000,
	      enableKeyboardControls: false,
	      enablePlayback: true,
	      formatOutput: function formatOutput(output) {
	        return '' + (output || '');
	      },
	      showTicks: true,
	      waitToUpdateMap: false,
	      position: 'bottomleft',
	      steps: 1000
	    };
	    this.timelines = [];
	    L.Util.setOptions(this, defaultOptions);
	    L.Util.setOptions(this, options);
	    if (typeof options.start !== 'undefined') {
	      this.start = options.start;
	    }
	    if (typeof options.end !== 'undefined') {
	      this.end = options.end;
	    }
	  },
	
	  /* INTERNAL API *************************************************************/
	
	  /**
	   * @private
	   * @returns {Number[]} A flat, sorted list of all the times of all layers
	   */
	  _getTimes: function _getTimes() {
	    var _this = this;
	
	    var times = [];
	    this.timelines.forEach(function (timeline) {
	      var timesInRange = timeline.times.filter(function (time) {
	        return time >= _this.start && time <= _this.end;
	      });
	      times.push.apply(times, _toConsumableArray(timesInRange));
	    });
	    if (times.length) {
	      var _ret = (function () {
	        times.sort(function (a, b) {
	          return a - b;
	        });
	        var dedupedTimes = [times[0]];
	        times.reduce(function (a, b) {
	          if (a !== b) {
	            dedupedTimes.push(b);
	          }
	          return b;
	        });
	        return {
	          v: dedupedTimes
	        };
	      })();
	
	      if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
	    }
	    return times;
	  },
	
	  /**
	   * Adjusts start/end/step size/etc. Should be called if any of those might
	   * change (e.g. when adding a new layer).
	   *
	   * @private
	   */
	  _recalculate: function _recalculate() {
	    var manualStart = typeof this.options.start !== 'undefined';
	    var manualEnd = typeof this.options.end !== 'undefined';
	    var duration = this.options.duration;
	    var min = Infinity;
	    var max = -Infinity;
	    this.timelines.forEach(function (timeline) {
	      if (timeline.start < min) {
	        min = timeline.start;
	      }
	      if (timeline.end > max) {
	        max = timeline.end;
	      }
	    });
	    if (!manualStart) {
	      this.start = min;
	      this._timeSlider.min = min === Infinity ? 0 : min;
	      this._timeSlider.value = this._timeSlider.min;
	    }
	    if (!manualEnd) {
	      this.end = max;
	      this._timeSlider.max = max === -Infinity ? 0 : max;
	    }
	    this._stepSize = Math.max(1, (this.end - this.start) / this.options.steps);
	    this._stepDuration = Math.max(1, duration / this.options.steps);
	  },
	
	  /**
	   * If `mode` is 0, finds the event nearest to `findTime`.
	   *
	   * If `mode` is 1, finds the event immediately after `findTime`.
	   *
	   * If `mode` is -1, finds the event immediately before `findTime`.
	   *
	   * @private
	   * @param {Number} findTime The time to find events around
	   * @param {Number} mode The operating mode. See main function description.
	   * @returns {Number} The time of the nearest event.
	   */
	  _nearestEventTime: function _nearestEventTime(findTime) {
	    var mode = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
	
	    var times = this._getTimes();
	    var retNext = false;
	    var lastTime = times[0];
	    for (var i = 1; i < times.length; i++) {
	      var time = times[i];
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
	          var prevDiff = Math.abs(findTime - lastTime);
	          var nextDiff = Math.abs(findTime - time);
	          return prevDiff < nextDiff ? lastTime : time;
	        }
	      }
	      lastTime = time;
	    }
	    return lastTime;
	  },
	
	  /* DOM CREATION & INTERACTION ***********************************************/
	
	  /**
	   * Create all of the DOM for the control.
	   *
	   * @private
	   */
	  _createDOM: function _createDOM() {
	    var classes = ['leaflet-control-layers', 'leaflet-control-layers-expanded', 'leaflet-timeline-control'];
	    var container = L.DomUtil.create('div', classes.join(' '));
	    this.container = container;
	    if (this.options.enablePlayback) {
	      var sliderCtrlC = L.DomUtil.create('div', 'sldr-ctrl-container', container);
	      var buttonContainer = L.DomUtil.create('div', 'button-container', sliderCtrlC);
	      this._makeButtons(buttonContainer);
	      if (this.options.enableKeyboardControls) {
	        this._addKeyListeners();
	      }
	      this._makeOutput(sliderCtrlC);
	    }
	    this._makeSlider(container);
	    if (this.options.showTicks) {
	      this._buildDataList(container);
	    }
	  },
	
	  /**
	   * Add keyboard listeners for keyboard control
	   *
	   * @private
	   */
	  _addKeyListeners: function _addKeyListeners() {
	    var _this2 = this;
	
	    this._listener = function () {
	      return _this2._onKeydown.apply(_this2, arguments);
	    };
	    document.addEventListener('keydown', this._listener);
	  },
	
	  /**
	   * Remove keyboard listeners
	   *
	   * @private
	   */
	  _removeKeyListeners: function _removeKeyListeners() {
	    document.removeEventListener('keydown', this._listener);
	  },
	
	  /**
	   * Constructs a <datalist>, for showing ticks on the range input.
	   *
	   * @private
	   * @param {HTMLElement} container The container to which to add the datalist
	   */
	  _buildDataList: function _buildDataList(container) {
	    this._datalist = L.DomUtil.create('datalist', '', container);
	    var idNum = Math.floor(Math.random() * 1000000);
	    this._datalist.id = 'timeline-datalist-' + idNum;
	    this._timeSlider.setAttribute('list', this._datalist.id);
	    this._rebuildDataList();
	  },
	
	  /**
	   * Reconstructs the <datalist>. Should be called when new data comes in.
	   */
	  _rebuildDataList: function _rebuildDataList() {
	    var datalist = this._datalist;
	    while (datalist.firstChild) {
	      datalist.removeChild(datalist.firstChild);
	    }
	    var datalistSelect = L.DomUtil.create('select', '', this._datalist);
	    this._getTimes().forEach(function (time) {
	      L.DomUtil.create('option', '', datalistSelect).value = time;
	    });
	  },
	
	  /**
	   * Makes a button with the passed name as a class, which calls the
	   * corresponding function when clicked. Attaches the button to container.
	   *
	   * @private
	   * @param {HTMLElement} container The container to which to add the button
	   * @param {String} name The class to give the button and the function to call
	   */
	  _makeButton: function _makeButton(container, name) {
	    var _this3 = this;
	
	    var button = L.DomUtil.create('button', name, container);
	    button.addEventListener('click', function () {
	      return _this3[name]();
	    });
	    L.DomEvent.disableClickPropagation(button);
	  },
	
	  /**
	   * Makes the prev, play, pause, and next buttons
	   *
	   * @private
	   * @param {HTMLElement} container The container to which to add the buttons
	   */
	  _makeButtons: function _makeButtons(container) {
	    this._makeButton(container, 'prev');
	    this._makeButton(container, 'play');
	    this._makeButton(container, 'pause');
	    this._makeButton(container, 'next');
	  },
	
	  /**
	   * Creates the range input
	   *
	   * @private
	   * @param {HTMLElement} container The container to which to add the input
	   */
	  _makeSlider: function _makeSlider(container) {
	    var _this4 = this;
	
	    var slider = L.DomUtil.create('input', 'time-slider', container);
	    slider.type = 'range';
	    slider.min = this.start || 0;
	    slider.max = this.end || 0;
	    slider.value = this.start || 0;
	    slider.addEventListener('change', function (e) {
	      return _this4._sliderChanged(e);
	    });
	    slider.addEventListener('input', function (e) {
	      return _this4._sliderChanged(e);
	    });
	    slider.addEventListener('mousedown', function () {
	      return _this4.map.dragging.disable();
	    });
	    document.addEventListener('mouseup', function () {
	      return _this4.map.dragging.enable();
	    });
	    this._timeSlider = slider;
	  },
	  _makeOutput: function _makeOutput(container) {
	    this._output = L.DomUtil.create('output', 'time-text', container);
	    this._output.innerHTML = this.options.formatOutput(this.start);
	  },
	  _onKeydown: function _onKeydown(e) {
	    switch (e.keyCode || e.which) {
	      case 37:
	        this.prev();break;
	      case 39:
	        this.next();break;
	      case 32:
	        this.toggle();break;
	      default:
	        return;
	    }
	    e.preventDefault();
	  },
	  _sliderChanged: function _sliderChanged(e) {
	    var time = parseFloat(e.target.value, 10);
	    this.time = time;
	    if (!this.options.waitToUpdateMap || e.type === 'change') {
	      this.timelines.forEach(function (timeline) {
	        return timeline.setTime(time);
	      });
	    }
	    if (this._output) {
	      this._output.innerHTML = this.options.formatOutput(time);
	    }
	  },
	
	  /* EXTERNAL API *************************************************************/
	
	  /**
	   * Register timeline layers with this control. This could change the start and
	   * end points of the timeline (unless manually set). It will also reset the
	   * playback.
	   *
	   * @param {...L.Timeline} timelines The `L.Timeline`s to register
	   */
	  addTimelines: function addTimelines() {
	    var _this5 = this;
	
	    this.pause();
	    var timelineCount = this.timelines.length;
	
	    for (var _len = arguments.length, timelines = Array(_len), _key = 0; _key < _len; _key++) {
	      timelines[_key] = arguments[_key];
	    }
	
	    timelines.forEach(function (timeline) {
	      if (_this5.timelines.indexOf(timeline) === -1) {
	        _this5.timelines.push(timeline);
	      }
	    });
	    if (this.timelines.length !== timelineCount) {
	      this._recalculate();
	      if (this.options.showTicks) {
	        this._rebuildDataList();
	      }
	      this.setTime(this.start);
	    }
	  },
	
	  /**
	   * Unregister timeline layers with this control. This could change the start
	   * and end points of the timeline unless manually set. It will also reset the
	   * playback.
	   *
	   * @param {...L.Timeline} timelines The `L.Timeline`s to unregister
	   */
	  removeTimelines: function removeTimelines() {
	    var _this6 = this;
	
	    this.pause();
	    var timelineCount = this.timelines.length;
	
	    for (var _len2 = arguments.length, timelines = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	      timelines[_key2] = arguments[_key2];
	    }
	
	    timelines.forEach(function (timeline) {
	      var index = _this6.timelines.indexOf(timeline);
	      if (index !== -1) {
	        _this6.timelines.splice(index, 1);
	      }
	    });
	    if (this.timelines.length !== timelineCount) {
	      this._recalculate();
	      if (this.options.showTicks) {
	        this._rebuildDataList();
	      }
	      this.setTime(this.start);
	    }
	  },
	
	  /**
	   * Toggles play/pause state.
	   */
	  toggle: function toggle() {
	    if (this._playing) {
	      this.pause();
	    } else {
	      this.play();
	    }
	  },
	
	  /**
	   * Pauses playback and goes to the previous event.
	   */
	  prev: function prev() {
	    this.pause();
	    var prevTime = this._nearestEventTime(this.time, -1);
	    this._timeSlider.value = prevTime;
	    this.setTime(prevTime);
	  },
	
	  /**
	   * Pauses playback.
	   */
	  pause: function pause() {
	    clearTimeout(this._timer);
	    this._playing = false;
	    this.container.classList.remove('playing');
	  },
	
	  /**
	   * Starts playback.
	   */
	  play: function play() {
	    var _this7 = this;
	
	    clearTimeout(this._timer);
	    if (parseFloat(this._timeSlider.value, 10) === this.end) {
	      this._timeSlider.value = this.start;
	    }
	    this._timeSlider.value = parseFloat(this._timeSlider.value, 10) + this._stepSize;
	    this.setTime(this._timeSlider.value);
	    if (parseFloat(this._timeSlider.value, 10) === this.end) {
	      this._playing = false;
	      this.container.classList.remove('playing');
	    } else {
	      this._playing = true;
	      this.container.classList.add('playing');
	      this._timer = setTimeout(function () {
	        return _this7.play();
	      }, this._stepDuration);
	    }
	  },
	
	  /**
	   * Pauses playback and goes to the next event.
	   */
	  next: function next() {
	    this.pause();
	    var nextTime = this._nearestEventTime(this.time, 1);
	    this._timeSlider.value = nextTime;
	    this.setTime(nextTime);
	  },
	
	  /**
	   * Set the time displayed.
	   *
	   * @param {Number} time The time to set
	   */
	  setTime: function setTime(time) {
	    this._sliderChanged({
	      type: 'change',
	      target: { value: time }
	    });
	  },
	  onAdd: function onAdd(map) {
	    this.map = map;
	    this._createDOM();
	    this.setTime(this.start);
	    return this.container;
	  },
	  onRemove: function onRemove() {
	    if (this.options.enableKeyboardControls) {
	      this._removeKeyListeners();
	    }
	  }
	});
	
	L.timelineSliderControl = function (timeline, start, end, timelist) {
	  return new L.TimelineSliderControl(timeline, start, end, timelist);
	};

/***/ },
/* 4 */
/***/ function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgOGExZmZmNzMyNzIwNjI3ZWExYzIiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL3NyYy9UaW1lbGluZS5qcyIsIndlYnBhY2s6Ly8vLi9+L2RpZXNhbC9zcmMvZHMvSW50ZXJ2YWxUcmVlLmpzIiwid2VicGFjazovLy8uL3NyYy9UaW1lbGluZVNsaWRlckNvbnRyb2wuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xlYWZsZXQudGltZWxpbmUuc2FzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsdUJBQWU7QUFDZjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7Ozs7Ozs7QUNwQ0EsRUFBQyxDQUFDLGVBQWUsR0FBRyxZQUFZLENBQUM7O0FBRWpDLG9CQUFPLENBQUMsQ0FBZSxDQUFDLENBQUM7QUFDekIsb0JBQU8sQ0FBQyxDQUE0QixDQUFDOzs7QUFHckMsb0JBQU8sQ0FBQyxDQUF5QixDQUFDLEM7Ozs7Ozs7Ozs7Ozs7Ozs7QUNKbEMsRUFBQyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztBQUM1QixRQUFLLEVBQUUsRUFBRTtBQUNULGtCQUFlLEVBQUUsRUFBRTtBQUNuQixTQUFNLEVBQUUsSUFBSTs7Ozs7Ozs7Ozs7OztBQWFaLGFBQVUsc0JBQUMsT0FBTyxFQUFnQjs7O1NBQWQsT0FBTyx5REFBRyxFQUFFOzs7OztBQUk5QixTQUFJLENBQUMsTUFBTSxHQUFHLDRCQUFrQixDQUFDO0FBQ2pDLFNBQU0sTUFBTSxHQUFHLDhDQUE4QyxDQUFDOzt3QkFDcEMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsT0FB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QUFDVCxTQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsc0JBQXNCLEVBQUU7QUFDdkMsV0FBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7TUFDNUI7SUFDRjtFQUNGLENBQUMsQ0FBQzs7QUFFSCxFQUFDLENBQUMscUJBQXFCLEdBQUcsVUFBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxRQUFRO1VBQ3ZELElBQUksQ0FBQyxDQUFDLHFCQUFxQixDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLFFBQVEsQ0FBQztFQUFBLEM7Ozs7OztBQ3pjN0QsMEMiLCJmaWxlIjoibGVhZmxldC50aW1lbGluZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuXG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRleHBvcnRzOiB7fSxcbiBcdFx0XHRpZDogbW9kdWxlSWQsXG4gXHRcdFx0bG9hZGVkOiBmYWxzZVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKDApO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogd2VicGFjay9ib290c3RyYXAgOGExZmZmNzMyNzIwNjI3ZWExYzJcbiAqKi8iLCIvKiBnbG9iYWwgcmVxdWlyZSwgTCAqL1xuXG5MLlRpbWVsaW5lVmVyc2lvbiA9ICcxLjAuMC1iZXRhJztcblxucmVxdWlyZSgnLi9UaW1lbGluZS5qcycpO1xucmVxdWlyZSgnLi9UaW1lbGluZVNsaWRlckNvbnRyb2wuanMnKTtcblxuLy8gd2VicGFjayByZXF1aXJlc1xucmVxdWlyZSgnLi9sZWFmbGV0LnRpbWVsaW5lLnNhc3MnKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2luZGV4LmpzXG4gKiovIiwiLyogZ2xvYmFsIEwgKi9cblxuaW1wb3J0IEludGVydmFsVHJlZSBmcm9tICdkaWVzYWwvc3JjL2RzL0ludGVydmFsVHJlZSc7XG5cbkwuVGltZWxpbmUgPSBMLkdlb0pTT04uZXh0ZW5kKHtcbiAgdGltZXM6IFtdLFxuICBkaXNwbGF5ZWRMYXllcnM6IFtdLFxuICByYW5nZXM6IG51bGwsXG5cbiAgLyoqXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKiBAcGFyYW0ge09iamVjdH0gZ2VvanNvbiBUaGUgR2VvSlNPTiBkYXRhIGZvciB0aGlzIGxheWVyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIEhhc2ggb2Ygb3B0aW9uc1xuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbb3B0aW9ucy5nZXRJbnRlcnZhbF0gQSBmdW5jdGlvbiB3aGljaCByZXR1cm5zIGFuIG9iamVjdFxuICAgKiB3aXRoIGBzdGFydGAgYW5kIGBlbmRgIHByb3BlcnRpZXMsIGNhbGxlZCBmb3IgZWFjaCBmZWF0dXJlIGluIHRoZSBHZW9KU09OXG4gICAqIGRhdGEuXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gW29wdGlvbnMuZHJhd09uU2V0VGltZT10cnVlXSBNYWtlIHRoZSBsYXllciBkcmF3IGFzIHNvb25cbiAgICogYXMgYHNldFRpbWVgIGlzIGNhbGxlZC4gSWYgdGhpcyBpcyBzZXQgdG8gZmFsc2UsIHlvdSB3aWxsIG5lZWQgdG8gY2FsbFxuICAgKiBgdXBkYXRlRGlzcGxheWVkTGF5ZXJzKClgIG1hbnVhbGx5LlxuICAgKi9cbiAgaW5pdGlhbGl6ZShnZW9qc29uLCBvcHRpb25zID0ge30pIHtcbiAgICAvLyBTb21lIGZ1bmN0aW9uYWxpdHkgd2FzIGNoYW5nZWQgYWZ0ZXIgTGVhZmxldCAwLjc7IHNvbWUgcGVvcGxlIHVzZSB0aGVcbiAgICAvLyBsYXRlc3Qgc3RhYmxlLCBzb21lIHVzZSB0aGUgYmV0YS4gVGhpcyBzaG91bGQgd29yayBlaXRoZXIgd2F5LCBzbyB3ZSBuZWVkXG4gICAgLy8gYSB2ZXJzaW9uIGNoZWNrLlxuICAgIHRoaXMucmFuZ2VzID0gbmV3IEludGVydmFsVHJlZSgpO1xuICAgIGNvbnN0IHNlbXZlciA9IC9eKFxcZCspKFxcLihcXGQrKSk/KFxcLihcXGQrKSk/KC0oLiopKT8oXFwrKC4qKSk/JC87XG4gICAgY29uc3QgWywgbWFqb3IsLCBtaW5vcl0gPSBzZW12ZXIuZXhlYyhMLnZlcnNpb24pO1xuICAgIHRoaXMuaXNPbGRWZXJzaW9uID0gcGFyc2VJbnQobWFqb3IsIDEwKSA9PT0gMCAmJiBwYXJzZUludChtaW5vciwgMTApIDw9IDc7XG4gICAgY29uc3QgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgICBkcmF3T25TZXRUaW1lOiB0cnVlLFxuICAgIH07XG4gICAgTC5HZW9KU09OLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcywgbnVsbCwgb3B0aW9ucyk7XG4gICAgTC5VdGlsLnNldE9wdGlvbnModGhpcywgZGVmYXVsdE9wdGlvbnMpO1xuICAgIEwuVXRpbC5zZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuZ2V0SW50ZXJ2YWwpIHtcbiAgICAgIHRoaXMuX2dldEludGVydmFsID0gKC4uLmFyZ3MpID0+IHRoaXMub3B0aW9ucy5nZXRJbnRlcnZhbCguLi5hcmdzKTtcbiAgICB9XG4gICAgaWYgKGdlb2pzb24pIHtcbiAgICAgIHRoaXMuX3Byb2Nlc3MoZ2VvanNvbik7XG4gICAgfVxuICB9LFxuXG4gIF9nZXRJbnRlcnZhbChmZWF0dXJlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXJ0OiBuZXcgRGF0ZShmZWF0dXJlLnByb3BlcnRpZXMuc3RhcnQpLmdldFRpbWUoKSxcbiAgICAgIGVuZDogbmV3IERhdGUoZmVhdHVyZS5wcm9wZXJ0aWVzLmVuZCkuZ2V0VGltZSgpLFxuICAgIH07XG4gIH0sXG5cbiAgLyoqXG4gICAqIEZpbmRzIHRoZSBmaXJzdCBhbmQgbGFzdCB0aW1lcyBpbiB0aGUgZGF0YXNldCwgYWRkcyBhbGwgdGltZXMgaW50byBhblxuICAgKiBhcnJheSwgYW5kIHB1dHMgZXZlcnl0aGluZyBpbnRvIGFuIEludGVydmFsVHJlZSBmb3IgcXVpY2sgbG9va3VwLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSBHZW9KU09OIHRvIHByb2Nlc3NcbiAgICovXG4gIF9wcm9jZXNzKGRhdGEpIHtcbiAgICAvLyBJbiBjYXNlIHdlIGRvbid0IGhhdmUgYSBtYW51YWxseSBzZXQgc3RhcnQgb3IgZW5kIHRpbWUsIHdlIG5lZWQgdG8gZmluZFxuICAgIC8vIHRoZSBleHRyZW1lcyBpbiB0aGUgZGF0YS4gV2UgY2FuIGRvIHRoYXQgd2hpbGUgd2UncmUgaW5zZXJ0aW5nIGV2ZXJ5dGhpbmdcbiAgICAvLyBpbnRvIHRoZSBpbnRlcnZhbCB0cmVlLlxuICAgIGxldCBzdGFydCA9IEluZmluaXR5O1xuICAgIGxldCBlbmQgPSAtSW5maW5pdHk7XG4gICAgZGF0YS5mZWF0dXJlcy5mb3JFYWNoKChmZWF0dXJlKSA9PiB7XG4gICAgICBjb25zdCBpbnRlcnZhbCA9IHRoaXMuX2dldEludGVydmFsKGZlYXR1cmUpO1xuICAgICAgdGhpcy5yYW5nZXMuaW5zZXJ0KGludGVydmFsLnN0YXJ0LCBpbnRlcnZhbC5lbmQsIGZlYXR1cmUpO1xuICAgICAgdGhpcy50aW1lcy5wdXNoKGludGVydmFsLnN0YXJ0KTtcbiAgICAgIHRoaXMudGltZXMucHVzaChpbnRlcnZhbC5lbmQpO1xuICAgICAgc3RhcnQgPSBNYXRoLm1pbihzdGFydCwgaW50ZXJ2YWwuc3RhcnQpO1xuICAgICAgZW5kID0gTWF0aC5tYXgoZW5kLCBpbnRlcnZhbC5lbmQpO1xuICAgIH0pO1xuICAgIHRoaXMuc3RhcnQgPSB0aGlzLm9wdGlvbnMuc3RhcnQgfHwgc3RhcnQ7XG4gICAgdGhpcy5lbmQgPSB0aGlzLm9wdGlvbnMuZW5kIHx8IGVuZDtcbiAgICB0aGlzLnRpbWUgPSB0aGlzLnN0YXJ0O1xuICAgIGlmICh0aGlzLnRpbWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBkZWZhdWx0IHNvcnQgaXMgbGV4aWNvZ3JhcGhpYywgZXZlbiBmb3IgbnVtYmVyIHR5cGVzLiBzbyBuZWVkIHRvXG4gICAgLy8gc3BlY2lmeSBzb3J0aW5nIGZ1bmN0aW9uLlxuICAgIHRoaXMudGltZXMuc29ydCgoYSwgYikgPT4gYSAtIGIpO1xuICAgIC8vIGRlLWR1cGxpY2F0ZSB0aGUgdGltZXNcbiAgICB0aGlzLnRpbWVzID0gdGhpcy50aW1lcy5yZWR1Y2UoKG5ld0xpc3QsIHgsIGkpID0+IHtcbiAgICAgIGlmIChpID09PSAwKSB7XG4gICAgICAgIHJldHVybiBuZXdMaXN0O1xuICAgICAgfVxuICAgICAgY29uc3QgbGFzdFRpbWUgPSBuZXdMaXN0W25ld0xpc3QubGVuZ3RoIC0gMV07XG4gICAgICBpZiAobGFzdFRpbWUgIT09IHgpIHtcbiAgICAgICAgbmV3TGlzdC5wdXNoKHgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ld0xpc3Q7XG4gICAgfSwgW3RoaXMudGltZXNbMF1dKTtcbiAgfSxcblxuICAvKipcbiAgICogT3ZlcnJpZGVzIGBMLkdlb0pTT05gJ3MgYWRkRGF0YS4gTGFyZ2VseSBjb3B5L3Bhc3RlICh3aXRoIHNvbWUgRVMyMDE1XG4gICAqIGNvbnZlcnNpb24pLCBidXQgdGhlIGtleSBkaWZmZXJlbmNlIGlzIHRoYXQgdGhpcyB3aWxsIGFsc28gdHJhY2sgdGhlIGxheWVyc1xuICAgKiB0aGF0IGhhdmUgYmVlbiBhZGRlZC5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3RbXXxPYmplY3R9IGdlb2pzb24gQSBHZW9KU09OIG9iamVjdCBvciBhcnJheSBvZiBHZW9KU09OXG4gICAqIG9iamVjdHMuXG4gICAqIEByZXR1cm5zIHtMLlRpbWVsaW5lfSBgdGhpc2BcbiAgICovXG4gIGFkZERhdGEoZ2VvanNvbikge1xuICAgIGNvbnN0IGZlYXR1cmVzID0gTC5VdGlsLmlzQXJyYXkoZ2VvanNvbikgPyBnZW9qc29uIDogZ2VvanNvbi5mZWF0dXJlcztcbiAgICBpZiAoZmVhdHVyZXMpIHtcbiAgICAgIGZlYXR1cmVzXG4gICAgICAuZmlsdGVyKChmKSA9PiBmLmdlb21ldHJpZXMgfHwgZi5nZW9tZXRyeSB8fCBmLmZlYXR1cmVzIHx8IGYuY29vcmRpbmF0ZXMpXG4gICAgICAuZm9yRWFjaCgoZmVhdHVyZSkgPT4gdGhpcy5hZGREYXRhKGZlYXR1cmUpKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLmZpbHRlciAmJiAhdGhpcy5vcHRpb25zLmZpbHRlcihnZW9qc29uKSkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGNvbnN0IGxheWVyID0gTC5HZW9KU09OLmdlb21ldHJ5VG9MYXllcihcbiAgICAgIGdlb2pzb24sXG4gICAgICB0aGlzLmlzT2xkVmVyc2lvbiA/IHRoaXMub3B0aW9ucy5wb2ludFRvTGF5ZXIgOiB0aGlzLm9wdGlvbnNcbiAgICApO1xuICAgIGlmICghbGF5ZXIpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvLyAqKiogdGhpcyBpcyB0aGUgbWFpbiBjdXN0b20gcGFydCwgaGVyZSAqKipcbiAgICB0aGlzLmRpc3BsYXllZExheWVycy5wdXNoKHtsYXllciwgZ2VvSlNPTjogZ2VvanNvbn0pO1xuICAgIC8vICoqKiBlbmQgY3VzdG9tIGJpdC4gd2Fzbid0IHRoYXQgdXNlZnVsPyAqKipcbiAgICBsYXllci5mZWF0dXJlID0gTC5HZW9KU09OLmFzRmVhdHVyZShnZW9qc29uKTtcbiAgICBsYXllci5kZWZhdWx0T3B0aW9ucyA9IGxheWVyLm9wdGlvbnM7XG4gICAgdGhpcy5yZXNldFN0eWxlKGxheWVyKTtcbiAgICBpZiAodGhpcy5vcHRpb25zLm9uRWFjaEZlYXR1cmUpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5vbkVhY2hGZWF0dXJlKGdlb2pzb24sIGxheWVyKTtcbiAgICB9XG4gICAgdGhpcy5hZGRMYXllcihsYXllcik7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYSBsYXllciwgb3B0aW9uYWxseSBhbHNvIHJlbW92aW5nIGl0IGZyb20gdGhlIGBkaXNwbGF5ZWRMYXllcnNgXG4gICAqIGFycmF5LlxuICAgKlxuICAgKiBAcGFyYW0ge0wuTGF5ZXJ9IGxheWVyIFRoZSBsYXllciB0byByZW1vdmVcbiAgICogQHBhcmFtIHtCb29sZWFufSBbcmVtb3ZlRGlzcGxheWVkXSBBbHNvIHJlbW92ZSBmcm9tIGBkaXNwbGF5ZWRMYXllcnNgXG4gICAqL1xuICByZW1vdmVMYXllcihsYXllciwgcmVtb3ZlRGlzcGxheWVkID0gdHJ1ZSkge1xuICAgIEwuR2VvSlNPTi5wcm90b3R5cGUucmVtb3ZlTGF5ZXIuY2FsbCh0aGlzLCBsYXllcik7XG4gICAgaWYgKHJlbW92ZURpc3BsYXllZCkge1xuICAgICAgdGhpcy5kaXNwbGF5ZWRMYXllcnMgPSB0aGlzLmRpc3BsYXllZExheWVycy5maWx0ZXIoXG4gICAgICAgIChkaXNwbGF5ZWRMYXllcikgPT4gZGlzcGxheWVkTGF5ZXIubGF5ZXIgIT09IGxheWVyXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogU2V0cyB0aGUgdGltZSBmb3IgdGhpcyBsYXllci5cbiAgICpcbiAgICogQHBhcmFtIHtOdW1iZXJ8U3RyaW5nfSB0aW1lIFRoZSB0aW1lIHRvIHNldC4gVXN1YWxseSBhIG51bWJlciwgYnV0IGlmIHlvdXJcbiAgICogZGF0YSBpcyByZWFsbHkgdGltZS1iYXNlZCB0aGVuIHlvdSBjYW4gcGFzcyBhIHN0cmluZyAoZS5nLiAnMjAxNS0wMS0wMScpXG4gICAqIGFuZCBpdCB3aWxsIGJlIHByb2Nlc3NlZCBpbnRvIGEgbnVtYmVyIGF1dG9tYXRpY2FsbHkuXG4gICAqL1xuICBzZXRUaW1lKHRpbWUpIHtcbiAgICB0aGlzLnRpbWUgPSB0eXBlb2YgdGltZSA9PT0gJ251bWJlcicgPyB0aW1lIDogbmV3IERhdGUodGltZSkuZ2V0VGltZSgpO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuZHJhd09uU2V0VGltZSkge1xuICAgICAgdGhpcy51cGRhdGVEaXNwbGF5ZWRMYXllcnMoKTtcbiAgICB9XG4gICAgdGhpcy5maXJlKCdjaGFuZ2UnKTtcbiAgfSxcblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBsYXllciB0byBzaG93IG9ubHkgdGhlIGZlYXR1cmVzIHRoYXQgYXJlIHJlbGV2YW50IGF0IHRoZSBjdXJyZW50XG4gICAqIHRpbWUuIFVzdWFsbHkgc2hvdWxkbid0IG5lZWQgdG8gYmUgY2FsbGVkIG1hbnVhbGx5LCB1bmxlc3MgeW91IHNldFxuICAgKiBgZHJhd09uU2V0VGltZWAgdG8gYGZhbHNlYC5cbiAgICovXG4gIHVwZGF0ZURpc3BsYXllZExheWVycygpIHtcbiAgICAvLyBUaGlzIGxvb3AgaXMgaW50ZW5kZWQgdG8gaGVscCBvcHRpbWl6ZSB0aGluZ3MgYSBiaXQuIEZpcnN0LCB3ZSBmaW5kIGFsbFxuICAgIC8vIHRoZSBmZWF0dXJlcyB0aGF0IHNob3VsZCBiZSBkaXNwbGF5ZWQgYXQgdGhlIGN1cnJlbnQgdGltZS5cbiAgICBjb25zdCBmZWF0dXJlcyA9IHRoaXMucmFuZ2VzLmxvb2t1cCh0aGlzLnRpbWUpO1xuICAgIC8vIFRoZW4gd2UgdHJ5IHRvIG1hdGNoIGVhY2ggY3VycmVudGx5IGRpc3BsYXllZCBsYXllciB1cCB0byBhIGZlYXR1cmUuIElmXG4gICAgLy8gd2UgZmluZCBhIG1hdGNoLCB0aGVuIHdlIHJlbW92ZSBpdCBmcm9tIHRoZSBmZWF0dXJlIGxpc3QuIElmIHdlIGRvbid0XG4gICAgLy8gZmluZCBhIG1hdGNoLCB0aGVuIHRoZSBkaXNwbGF5ZWQgbGF5ZXIgaXMgbm8gbG9uZ2VyIHZhbGlkIGF0IHRoaXMgdGltZS5cbiAgICAvLyBXZSBzaG91bGQgcmVtb3ZlIGl0LlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5kaXNwbGF5ZWRMYXllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBmb3VuZCA9IGZhbHNlO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBmZWF0dXJlcy5sZW5ndGg7IGorKykge1xuICAgICAgICBpZiAodGhpcy5kaXNwbGF5ZWRMYXllcnNbaV0uZ2VvSlNPTiA9PT0gZmVhdHVyZXNbal0pIHtcbiAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgZmVhdHVyZXMuc3BsaWNlKGosIDEpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgIGNvbnN0IHRvUmVtb3ZlID0gdGhpcy5kaXNwbGF5ZWRMYXllcnMuc3BsaWNlKGktLSwgMSk7XG4gICAgICAgIHRoaXMucmVtb3ZlTGF5ZXIodG9SZW1vdmVbMF0ubGF5ZXIsIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gRmluYWxseSwgd2l0aCBhbnkgZmVhdHVyZXMgbGVmdCwgdGhleSBtdXN0IGJlIG5ldyBkYXRhISBXZSBjYW4gYWRkIHRoZW0uXG4gICAgZmVhdHVyZXMuZm9yRWFjaCgoZmVhdHVyZSkgPT4gdGhpcy5hZGREYXRhKGZlYXR1cmUpKTtcbiAgfSxcblxuICBnZXREaXNwbGF5ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGxheWVkTGF5ZXJzLm1hcCgobGF5ZXIpID0+IGxheWVyLmdlb0pTT04pO1xuICB9LFxufSk7XG5cbkwudGltZWxpbmUgPSAoZ2VvanNvbiwgb3B0aW9ucykgPT4gbmV3IEwuVGltZWxpbmUoZ2VvanNvbiwgb3B0aW9ucyk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9UaW1lbGluZS5qc1xuICoqLyIsIlxuLyoqXG4gKiBBIG5vZGUgaW4gdGhlIGludGVydmFsIHRyZWUuXG4gKlxuICogQHByb3BlcnR5IHtOdW1iZXJ9IGxvdyBTdGFydCBvZiB0aGUgaW50ZXJ2YWxcbiAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBoaWdoIEVuZCBvZiB0aGUgaW50ZXJ2YWxcbiAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBtYXggVGhlIGdyZWF0ZXN0IGVuZHBvaW50IG9mIHRoaXMgbm9kZSdzIGludGVydmFsIG9yIGFueVxuICogb2YgaXRzIGNoaWxkcmVuLlxuICogQHByb3BlcnR5IHsqfSBkYXRhIFRoZSB2YWx1ZSBvZiB0aGUgaW50ZXJ2YWxcbiAqIEBwcm9wZXJ0eSB7SW50ZXJ2YWxUcmVlTm9kZT99IGxlZnQgTGVmdCBjaGlsZCAobG93ZXIgaW50ZXJ2YWxzKVxuICogQHByb3BlcnR5IHtJbnRlcnZhbFRyZWVOb2RlP30gcmlnaHQgUmlnaHQgY2hpbGQgKGhpZ2hlciBpbnRlcnZhbHMpXG4gKiBAcHJvcGVydHkge0ludGVydmFsVHJlZU5vZGU/fSBwYXJlbnQgVGhlIHBhcmVudCBvZiB0aGlzIG5vZGVcbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIEludGVydmFsVHJlZU5vZGUge1xuICBjb25zdHJ1Y3Rvcihsb3csIGhpZ2gsIGRhdGEsIHBhcmVudCkge1xuICAgIHRoaXMubG93ID0gbG93O1xuICAgIHRoaXMuaGlnaCA9IGhpZ2g7XG4gICAgdGhpcy5tYXggPSBoaWdoO1xuICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gICAgdGhpcy5sZWZ0ID0gbnVsbDtcbiAgICB0aGlzLnJpZ2h0ID0gbnVsbDtcbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBJbnRlcnZhbFRyZWUge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9yb290ID0gbnVsbDtcbiAgICB0aGlzLnNpemUgPSAwO1xuICB9XG5cbiAgLyoqXG4gICAqIEFjdHVhbGx5IGluc2VydCBhIG5ldyBpbnRlcnZhbCBpbnRvIHRoZSB0cmVlLiBUaGlzIGhhcyBhIGZldyBleHRyYVxuICAgKiBhcmd1bWVudHMgdGhhdCBkb24ndCByZWFsbHkgbmVlZCB0byBiZSBleHBvc2VkIGluIHRoZSBwdWJsaWMgQVBJLCBoZW5jZSB0aGVcbiAgICogc2VwYXJhdGlvbi5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGJlZ2luIFN0YXJ0IG9mIHRoZSBpbnRlcnZhbFxuICAgKiBAcGFyYW0ge051bWJlcn0gZW5kIEVuZCBvZiB0aGUgaW50ZXJ2YWxcbiAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgb2YgdGhlIGludGVydmFsXG4gICAqIEBwYXJhbSB7SW50ZXJ2YWxUcmVlTm9kZT99IG5vZGUgVGhlIGN1cnJlbnQgcGxhY2Ugd2UgYXJlIGxvb2tpbmcgYXQgdG8gYWRkXG4gICAqIHRoZSBpbnRlcnZhbFxuICAgKiBAcGFyYW0ge0ludGVydmFsVHJlZU5vZGU/fSBwYXJlbnQgVGhlIHBhcmVudCBvZiB0aGUgcGxhY2Ugd2UgYXJlIGxvb2tpbmcgdG9cbiAgICogYWRkIHRoZSBpbnRlcnZhbFxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGFyZW50U2lkZSBUaGUgc2lkZSBvZiB0aGUgcGFyZW50IHdlJ3JlIGxvb2tpbmcgYXRcbiAgICogQHJldHVybnMge0ludGVydmFsVHJlZU5vZGV9IFRoZSBuZXdseSBhZGRlZCBub2RlXG4gICAqL1xuICBfaW5zZXJ0KGJlZ2luLCBlbmQsIHZhbHVlLCBub2RlLCBwYXJlbnQsIHBhcmVudFNpZGUpIHtcbiAgICBsZXQgbmV3Tm9kZTtcbiAgICBpZiAobm9kZSA9PT0gbnVsbCkge1xuICAgICAgLy8gVGhlIHBsYWNlIHdlJ3JlIGxvb2tpbmcgYXQgaXMgYXZhaWxhYmxlOyBsZXQncyBwdXQgb3VyIG5vZGUgaGVyZS5cbiAgICAgIG5ld05vZGUgPSBuZXcgSW50ZXJ2YWxUcmVlTm9kZShiZWdpbiwgZW5kLCB2YWx1ZSwgcGFyZW50KTtcbiAgICAgIGlmIChwYXJlbnQgPT09IG51bGwpIHtcbiAgICAgICAgLy8gTm8gcGFyZW50PyBNdXN0IGJlIHJvb3QuXG4gICAgICAgIHRoaXMuX3Jvb3QgPSBuZXdOb2RlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIC8vIExldCB0aGUgcGFyZW50IGtub3cgYWJvdXQgaXRzIG5ldyBjaGlsZFxuICAgICAgICBwYXJlbnRbcGFyZW50U2lkZV0gPSBuZXdOb2RlO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIC8vIE5vIHZhY2FuY2llcy4gRmlndXJlIG91dCB3aGljaCBzaWRlIHdlIHNob3VsZCBiZSBwdXR0aW5nIG91ciBpbnRlcnZhbCxcbiAgICAgIC8vIGFuZCB0aGVuIHJlY3Vyc2UuXG4gICAgICBjb25zdCBzaWRlID0gKGJlZ2luIDwgbm9kZS5sb3cgfHwgYmVnaW4gPT09IG5vZGUubG93ICYmIGVuZCA8IG5vZGUuaGlnaClcbiAgICAgICAgPyAnbGVmdCdcbiAgICAgICAgOiAncmlnaHQnO1xuICAgICAgbmV3Tm9kZSA9IHRoaXMuX2luc2VydChiZWdpbiwgZW5kLCB2YWx1ZSwgbm9kZVtzaWRlXSwgbm9kZSwgc2lkZSk7XG4gICAgICBub2RlLm1heCA9IE1hdGgubWF4KG5vZGUubWF4LCBuZXdOb2RlLm1heCk7XG4gICAgfVxuICAgIHJldHVybiBuZXdOb2RlO1xuICB9XG5cbiAgLyoqXG4gICAqIEluc2VydCBhIG5ldyB2YWx1ZSBpbnRvIHRoZSB0cmVlLCBmb3IgdGhlIGdpdmVuIGludGVydmFsLlxuICAgKlxuICAgKiBAcGFyYW0ge051bWJlcn0gYmVnaW4gVGhlIHN0YXJ0IG9mIHRoZSB2YWxpZCBpbnRlcnZhbFxuICAgKiBAcGFyYW0ge051bWJlcn0gZW5kIFRoZSBlbmQgb2YgdGhlIHZhbGlkIGludGVydmFsXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIGZvciB0aGUgaW50ZXJ2YWxcbiAgICovXG4gIGluc2VydChiZWdpbiwgZW5kLCB2YWx1ZSkge1xuICAgIHRoaXMuX2luc2VydChiZWdpbiwgZW5kLCB2YWx1ZSwgdGhpcy5fcm9vdCwgdGhpcy5fcm9vdCk7XG4gICAgdGhpcy5zaXplKys7XG4gIH1cblxuICAvKipcbiAgICogRmluZCBhbGwgaW50ZXJ2YWxzIHRoYXQgY292ZXIgYSBjZXJ0YWluIHBvaW50LlxuICAgKlxuICAgKiBAcGFyYW0ge051bWJlcn0gcG9pbnQgVGhlIHNvdWdodCBwb2ludFxuICAgKiBAcmV0dXJucyB7KltdfSBBbiBhcnJheSBvZiBhbGwgdmFsdWVzIHRoYXQgYXJlIHZhbGlkIGF0IHRoZSBnaXZlbiBwb2ludC5cbiAgICovXG4gIGxvb2t1cChwb2ludCkge1xuICAgIGNvbnN0IG92ZXJsYXBzID0gW107XG4gICAgbGV0IG5vZGUgPSB0aGlzLl9yb290O1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgICBub2RlID0gYXJndW1lbnRzWzFdO1xuICAgIH1cbiAgICBpZiAobm9kZSA9PT0gbnVsbCB8fCBub2RlLm1heCA8IHBvaW50KSB7XG4gICAgICByZXR1cm4gb3ZlcmxhcHM7XG4gICAgfVxuICAgIG92ZXJsYXBzLnB1c2goLi4udGhpcy5sb29rdXAocG9pbnQsIG5vZGUubGVmdCkpO1xuICAgIGlmIChub2RlLmxvdyA8PSBwb2ludCkge1xuICAgICAgaWYgKG5vZGUuaGlnaCA+PSBwb2ludCkge1xuICAgICAgICBvdmVybGFwcy5wdXNoKG5vZGUuZGF0YSk7XG4gICAgICB9XG4gICAgICBvdmVybGFwcy5wdXNoKC4uLnRoaXMubG9va3VwKHBvaW50LCBub2RlLnJpZ2h0KSk7XG4gICAgfVxuICAgIHJldHVybiBvdmVybGFwcztcbiAgfVxufVxuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L2RpZXNhbC9zcmMvZHMvSW50ZXJ2YWxUcmVlLmpzXG4gKiovIiwiLyogZ2xvYmFsIEwgKi9cblxuLypcbiAqIEBjbGFzc1xuICogQGV4dGVuZHMgTC5Db250cm9sXG4gKi9cbkwuVGltZWxpbmVTbGlkZXJDb250cm9sID0gTC5Db250cm9sLmV4dGVuZCh7XG4gIC8qKlxuICAgKiBAY29uc3RydWN0b3JcbiAgICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLmR1cmF0aW9uPTYwMDAwMF0gVGhlIGFtb3VudCBvZiB0aW1lIGEgY29tcGxldGVcbiAgICogcGxheWJhY2sgc2hvdWxkIHRha2UuIE5vdCBndWFyYW50ZWVkOyBpZiB0aGVyZSdzIGEgbG90IG9mIGRhdGEgb3JcbiAgICogY29tcGxpY2F0ZWQgcmVuZGVyaW5nLCBpdCB3aWxsIGxpa2VseSB3aW5kIHVwIHRha2luZyBsb25nZXIuXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gW29wdGlvbnMuZW5hYmxlS2V5Ym9hcmRDb250cm9scz1mYWxzZV0gQWxsb3cgcGxheWJhY2sgdG9cbiAgICogYmUgY29udHJvbGxlZCB1c2luZyB0aGUgc3BhY2ViYXIgKHBsYXkvcGF1c2UpIGFuZCByaWdodC9sZWZ0IGFycm93IGtleXNcbiAgICogKG5leHQvcHJldmlvdXMpLlxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IFtvcHRpb25zLmVuYWJsZVBsYXliYWNrPXRydWVdIFNob3cgcGxheWJhY2sgY29udHJvbHMgKGkuZS5cbiAgICogcHJldi9wbGF5L3BhdXNlL25leHQpLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbb3B0aW9ucy5mb3JtYXRPdXRwdXRdIEEgZnVuY3Rpb24gd2hpY2ggdGFrZXMgdGhlIGN1cnJlbnRcbiAgICogdGltZSB2YWx1ZSAodXN1YWxseSBhIFVuaXggdGltZXN0YW1wKSBhbmQgb3V0cHV0cyBhIHN0cmluZyB0aGF0IGlzXG4gICAqIGRpc3BsYXllZCBiZW5lYXRoIHRoZSBjb250cm9sIGJ1dHRvbnMuXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gW29wdGlvbnMuc2hvd1RpY2tzPXRydWVdIFNob3cgdGlja3Mgb24gdGhlIHRpbWVsaW5lIChpZlxuICAgKiB0aGUgYnJvd3NlciBzdXBwb3J0cyBpdCkuXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gW29wdGlvbnMud2FpdFRvVXBkYXRlTWFwPWZhbHNlXSBXYWl0IHVudGlsIHRoZSB1c2VyIGlzXG4gICAqIGZpbmlzaGVkIGNoYW5naW5nIHRoZSBkYXRlIHRvIHVwZGF0ZSB0aGUgbWFwLiBCeSBkZWZhdWx0LCBib3RoIHRoZSBtYXAgYW5kXG4gICAqIHRoZSBkYXRlIHVwZGF0ZSBmb3IgZXZlcnkgY2hhbmdlLiBXaXRoIGNvbXBsZXggZGF0YSwgdGhpcyBjYW4gc2xvdyB0aGluZ3NcbiAgICogZG93biwgc28gc2V0IHRoaXMgdG8gdHJ1ZSB0byBvbmx5IHVwZGF0ZSB0aGUgZGlzcGxheWVkIGRhdGUuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5zdGFydF0gVGhlIHN0YXJ0IHRpbWUgb2YgdGhlIHRpbWVsaW5lLiBJZiB1bnNldCxcbiAgICogdGhpcyB3aWxsIGJlIGNhbGN1bGF0ZWQgYXV0b21hdGljYWxseSBiYXNlZCBvbiB0aGUgdGltZWxpbmVzIHJlZ2lzdGVyZWQgdG9cbiAgICogdGhpcyBjb250cm9sLlxuICAgKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMuZW5kXSBUaGUgZW5kIHRpbWUgb2YgdGhlIHRpbWVsaW5lLiBJZiB1bnNldCwgdGhpc1xuICAgKiB3aWxsIGJlIGNhbGN1bGF0ZWQgYXV0b21hdGljYWxseSBiYXNlZCBvbiB0aGUgdGltZWxpbmVzIHJlZ2lzdGVyZWQgdG8gdGhpc1xuICAgKiBjb250cm9sLlxuICAgKi9cbiAgaW5pdGlhbGl6ZShvcHRpb25zID0ge30pIHtcbiAgICBjb25zdCBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICAgIGR1cmF0aW9uOiAgICAgICAgICAgICAgIDEwMDAwLFxuICAgICAgZW5hYmxlS2V5Ym9hcmRDb250cm9sczogZmFsc2UsXG4gICAgICBlbmFibGVQbGF5YmFjazogICAgICAgICB0cnVlLFxuICAgICAgZm9ybWF0T3V0cHV0OiAgICAgICAgICAgKG91dHB1dCkgPT4gYCR7b3V0cHV0IHx8ICcnfWAsXG4gICAgICBzaG93VGlja3M6ICAgICAgICAgICAgICB0cnVlLFxuICAgICAgd2FpdFRvVXBkYXRlTWFwOiAgICAgICAgZmFsc2UsXG4gICAgICBwb3NpdGlvbjogICAgICAgICAgICAgICAnYm90dG9tbGVmdCcsXG4gICAgICBzdGVwczogICAgICAgICAgICAgICAgICAxMDAwLFxuICAgIH07XG4gICAgdGhpcy50aW1lbGluZXMgPSBbXTtcbiAgICBMLlV0aWwuc2V0T3B0aW9ucyh0aGlzLCBkZWZhdWx0T3B0aW9ucyk7XG4gICAgTC5VdGlsLnNldE9wdGlvbnModGhpcywgb3B0aW9ucyk7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zLnN0YXJ0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgdGhpcy5zdGFydCA9IG9wdGlvbnMuc3RhcnQ7XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5lbmQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aGlzLmVuZCA9IG9wdGlvbnMuZW5kO1xuICAgIH1cbiAgfSxcblxuICAvKiBJTlRFUk5BTCBBUEkgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICogQHJldHVybnMge051bWJlcltdfSBBIGZsYXQsIHNvcnRlZCBsaXN0IG9mIGFsbCB0aGUgdGltZXMgb2YgYWxsIGxheWVyc1xuICAgKi9cbiAgX2dldFRpbWVzKCkge1xuICAgIGNvbnN0IHRpbWVzID0gW107XG4gICAgdGhpcy50aW1lbGluZXMuZm9yRWFjaCgodGltZWxpbmUpID0+IHtcbiAgICAgIGNvbnN0IHRpbWVzSW5SYW5nZSA9IHRpbWVsaW5lLnRpbWVzXG4gICAgICAgIC5maWx0ZXIoKHRpbWUpID0+IHRpbWUgPj0gdGhpcy5zdGFydCAmJiB0aW1lIDw9IHRoaXMuZW5kKTtcbiAgICAgIHRpbWVzLnB1c2goLi4udGltZXNJblJhbmdlKTtcbiAgICB9KTtcbiAgICBpZiAodGltZXMubGVuZ3RoKSB7XG4gICAgICB0aW1lcy5zb3J0KChhLCBiKSA9PiBhIC0gYik7XG4gICAgICBjb25zdCBkZWR1cGVkVGltZXMgPSBbdGltZXNbMF1dO1xuICAgICAgdGltZXMucmVkdWNlKChhLCBiKSA9PiB7XG4gICAgICAgIGlmIChhICE9PSBiKSB7XG4gICAgICAgICAgZGVkdXBlZFRpbWVzLnB1c2goYik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGI7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBkZWR1cGVkVGltZXM7XG4gICAgfVxuICAgIHJldHVybiB0aW1lcztcbiAgfSxcblxuICAvKipcbiAgICogQWRqdXN0cyBzdGFydC9lbmQvc3RlcCBzaXplL2V0Yy4gU2hvdWxkIGJlIGNhbGxlZCBpZiBhbnkgb2YgdGhvc2UgbWlnaHRcbiAgICogY2hhbmdlIChlLmcuIHdoZW4gYWRkaW5nIGEgbmV3IGxheWVyKS5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9yZWNhbGN1bGF0ZSgpIHtcbiAgICBjb25zdCBtYW51YWxTdGFydCA9IHR5cGVvZiB0aGlzLm9wdGlvbnMuc3RhcnQgIT09ICd1bmRlZmluZWQnO1xuICAgIGNvbnN0IG1hbnVhbEVuZCA9IHR5cGVvZiB0aGlzLm9wdGlvbnMuZW5kICE9PSAndW5kZWZpbmVkJztcbiAgICBjb25zdCBkdXJhdGlvbiA9IHRoaXMub3B0aW9ucy5kdXJhdGlvbjtcbiAgICBsZXQgbWluID0gSW5maW5pdHk7XG4gICAgbGV0IG1heCA9IC1JbmZpbml0eTtcbiAgICB0aGlzLnRpbWVsaW5lcy5mb3JFYWNoKCh0aW1lbGluZSkgPT4ge1xuICAgICAgaWYgKHRpbWVsaW5lLnN0YXJ0IDwgbWluKSB7XG4gICAgICAgIG1pbiA9IHRpbWVsaW5lLnN0YXJ0O1xuICAgICAgfVxuICAgICAgaWYgKHRpbWVsaW5lLmVuZCA+IG1heCkge1xuICAgICAgICBtYXggPSB0aW1lbGluZS5lbmQ7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKCFtYW51YWxTdGFydCkge1xuICAgICAgdGhpcy5zdGFydCA9IG1pbjtcbiAgICAgIHRoaXMuX3RpbWVTbGlkZXIubWluID0gbWluID09PSBJbmZpbml0eSA/IDAgOiBtaW47XG4gICAgICB0aGlzLl90aW1lU2xpZGVyLnZhbHVlID0gdGhpcy5fdGltZVNsaWRlci5taW47XG4gICAgfVxuICAgIGlmICghbWFudWFsRW5kKSB7XG4gICAgICB0aGlzLmVuZCA9IG1heDtcbiAgICAgIHRoaXMuX3RpbWVTbGlkZXIubWF4ID0gbWF4ID09PSAtSW5maW5pdHkgPyAwIDogbWF4O1xuICAgIH1cbiAgICB0aGlzLl9zdGVwU2l6ZSA9IE1hdGgubWF4KDEsICh0aGlzLmVuZCAtIHRoaXMuc3RhcnQpIC8gdGhpcy5vcHRpb25zLnN0ZXBzKTtcbiAgICB0aGlzLl9zdGVwRHVyYXRpb24gPSBNYXRoLm1heCgxLCBkdXJhdGlvbiAvIHRoaXMub3B0aW9ucy5zdGVwcyk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIElmIGBtb2RlYCBpcyAwLCBmaW5kcyB0aGUgZXZlbnQgbmVhcmVzdCB0byBgZmluZFRpbWVgLlxuICAgKlxuICAgKiBJZiBgbW9kZWAgaXMgMSwgZmluZHMgdGhlIGV2ZW50IGltbWVkaWF0ZWx5IGFmdGVyIGBmaW5kVGltZWAuXG4gICAqXG4gICAqIElmIGBtb2RlYCBpcyAtMSwgZmluZHMgdGhlIGV2ZW50IGltbWVkaWF0ZWx5IGJlZm9yZSBgZmluZFRpbWVgLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge051bWJlcn0gZmluZFRpbWUgVGhlIHRpbWUgdG8gZmluZCBldmVudHMgYXJvdW5kXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBtb2RlIFRoZSBvcGVyYXRpbmcgbW9kZS4gU2VlIG1haW4gZnVuY3Rpb24gZGVzY3JpcHRpb24uXG4gICAqIEByZXR1cm5zIHtOdW1iZXJ9IFRoZSB0aW1lIG9mIHRoZSBuZWFyZXN0IGV2ZW50LlxuICAgKi9cbiAgX25lYXJlc3RFdmVudFRpbWUoZmluZFRpbWUsIG1vZGUgPSAwKSB7XG4gICAgY29uc3QgdGltZXMgPSB0aGlzLl9nZXRUaW1lcygpO1xuICAgIGxldCByZXROZXh0ID0gZmFsc2U7XG4gICAgbGV0IGxhc3RUaW1lID0gdGltZXNbMF07XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCB0aW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgdGltZSA9IHRpbWVzW2ldO1xuICAgICAgaWYgKHJldE5leHQpIHtcbiAgICAgICAgcmV0dXJuIHRpbWU7XG4gICAgICB9XG4gICAgICBpZiAodGltZSA+PSBmaW5kVGltZSkge1xuICAgICAgICBpZiAobW9kZSA9PT0gLTEpIHtcbiAgICAgICAgICByZXR1cm4gbGFzdFRpbWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobW9kZSA9PT0gMSkge1xuICAgICAgICAgIGlmICh0aW1lID09PSBmaW5kVGltZSkge1xuICAgICAgICAgICAgcmV0TmV4dCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRpbWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHByZXZEaWZmID0gTWF0aC5hYnMoZmluZFRpbWUgLSBsYXN0VGltZSk7XG4gICAgICAgICAgY29uc3QgbmV4dERpZmYgPSBNYXRoLmFicyhmaW5kVGltZSAtIHRpbWUpO1xuICAgICAgICAgIHJldHVybiBwcmV2RGlmZiA8IG5leHREaWZmID8gbGFzdFRpbWUgOiB0aW1lO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBsYXN0VGltZSA9IHRpbWU7XG4gICAgfVxuICAgIHJldHVybiBsYXN0VGltZTtcbiAgfSxcblxuICAvKiBET00gQ1JFQVRJT04gJiBJTlRFUkFDVElPTiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAvKipcbiAgICogQ3JlYXRlIGFsbCBvZiB0aGUgRE9NIGZvciB0aGUgY29udHJvbC5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9jcmVhdGVET00oKSB7XG4gICAgY29uc3QgY2xhc3NlcyA9IFtcbiAgICAgICdsZWFmbGV0LWNvbnRyb2wtbGF5ZXJzJyxcbiAgICAgICdsZWFmbGV0LWNvbnRyb2wtbGF5ZXJzLWV4cGFuZGVkJyxcbiAgICAgICdsZWFmbGV0LXRpbWVsaW5lLWNvbnRyb2wnLFxuICAgIF07XG4gICAgY29uc3QgY29udGFpbmVyID0gTC5Eb21VdGlsLmNyZWF0ZSgnZGl2JywgY2xhc3Nlcy5qb2luKCcgJykpO1xuICAgIHRoaXMuY29udGFpbmVyID0gY29udGFpbmVyO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuZW5hYmxlUGxheWJhY2spIHtcbiAgICAgIGNvbnN0IHNsaWRlckN0cmxDID0gTC5Eb21VdGlsLmNyZWF0ZShcbiAgICAgICAgJ2RpdicsXG4gICAgICAgICdzbGRyLWN0cmwtY29udGFpbmVyJyxcbiAgICAgICAgY29udGFpbmVyXG4gICAgICApO1xuICAgICAgY29uc3QgYnV0dG9uQ29udGFpbmVyID0gTC5Eb21VdGlsLmNyZWF0ZShcbiAgICAgICAgJ2RpdicsXG4gICAgICAgICdidXR0b24tY29udGFpbmVyJyxcbiAgICAgICAgc2xpZGVyQ3RybENcbiAgICAgICk7XG4gICAgICB0aGlzLl9tYWtlQnV0dG9ucyhidXR0b25Db250YWluZXIpO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5lbmFibGVLZXlib2FyZENvbnRyb2xzKSB7XG4gICAgICAgIHRoaXMuX2FkZEtleUxpc3RlbmVycygpO1xuICAgICAgfVxuICAgICAgdGhpcy5fbWFrZU91dHB1dChzbGlkZXJDdHJsQyk7XG4gICAgfVxuICAgIHRoaXMuX21ha2VTbGlkZXIoY29udGFpbmVyKTtcbiAgICBpZiAodGhpcy5vcHRpb25zLnNob3dUaWNrcykge1xuICAgICAgdGhpcy5fYnVpbGREYXRhTGlzdChjb250YWluZXIpO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogQWRkIGtleWJvYXJkIGxpc3RlbmVycyBmb3Iga2V5Ym9hcmQgY29udHJvbFxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2FkZEtleUxpc3RlbmVycygpIHtcbiAgICB0aGlzLl9saXN0ZW5lciA9ICguLi5hcmdzKSA9PiB0aGlzLl9vbktleWRvd24oLi4uYXJncyk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX2xpc3RlbmVyKTtcbiAgfSxcblxuICAvKipcbiAgICogUmVtb3ZlIGtleWJvYXJkIGxpc3RlbmVyc1xuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3JlbW92ZUtleUxpc3RlbmVycygpIHtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fbGlzdGVuZXIpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RzIGEgPGRhdGFsaXN0PiwgZm9yIHNob3dpbmcgdGlja3Mgb24gdGhlIHJhbmdlIGlucHV0LlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBjb250YWluZXIgVGhlIGNvbnRhaW5lciB0byB3aGljaCB0byBhZGQgdGhlIGRhdGFsaXN0XG4gICAqL1xuICBfYnVpbGREYXRhTGlzdChjb250YWluZXIpIHtcbiAgICB0aGlzLl9kYXRhbGlzdCA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RhdGFsaXN0JywgJycsIGNvbnRhaW5lcik7XG4gICAgY29uc3QgaWROdW0gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMDAwMDAwKTtcbiAgICB0aGlzLl9kYXRhbGlzdC5pZCA9IGB0aW1lbGluZS1kYXRhbGlzdC0ke2lkTnVtfWA7XG4gICAgdGhpcy5fdGltZVNsaWRlci5zZXRBdHRyaWJ1dGUoJ2xpc3QnLCB0aGlzLl9kYXRhbGlzdC5pZCk7XG4gICAgdGhpcy5fcmVidWlsZERhdGFMaXN0KCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJlY29uc3RydWN0cyB0aGUgPGRhdGFsaXN0Pi4gU2hvdWxkIGJlIGNhbGxlZCB3aGVuIG5ldyBkYXRhIGNvbWVzIGluLlxuICAgKi9cbiAgX3JlYnVpbGREYXRhTGlzdCgpIHtcbiAgICBjb25zdCBkYXRhbGlzdCA9IHRoaXMuX2RhdGFsaXN0O1xuICAgIHdoaWxlIChkYXRhbGlzdC5maXJzdENoaWxkKSB7XG4gICAgICBkYXRhbGlzdC5yZW1vdmVDaGlsZChkYXRhbGlzdC5maXJzdENoaWxkKTtcbiAgICB9XG4gICAgY29uc3QgZGF0YWxpc3RTZWxlY3QgPSBMLkRvbVV0aWwuY3JlYXRlKCdzZWxlY3QnLCAnJywgdGhpcy5fZGF0YWxpc3QpO1xuICAgIHRoaXMuX2dldFRpbWVzKCkuZm9yRWFjaCgodGltZSkgPT4ge1xuICAgICAgTC5Eb21VdGlsLmNyZWF0ZSgnb3B0aW9uJywgJycsIGRhdGFsaXN0U2VsZWN0KS52YWx1ZSA9IHRpbWU7XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIE1ha2VzIGEgYnV0dG9uIHdpdGggdGhlIHBhc3NlZCBuYW1lIGFzIGEgY2xhc3MsIHdoaWNoIGNhbGxzIHRoZVxuICAgKiBjb3JyZXNwb25kaW5nIGZ1bmN0aW9uIHdoZW4gY2xpY2tlZC4gQXR0YWNoZXMgdGhlIGJ1dHRvbiB0byBjb250YWluZXIuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGNvbnRhaW5lciBUaGUgY29udGFpbmVyIHRvIHdoaWNoIHRvIGFkZCB0aGUgYnV0dG9uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFRoZSBjbGFzcyB0byBnaXZlIHRoZSBidXR0b24gYW5kIHRoZSBmdW5jdGlvbiB0byBjYWxsXG4gICAqL1xuICBfbWFrZUJ1dHRvbihjb250YWluZXIsIG5hbWUpIHtcbiAgICBjb25zdCBidXR0b24gPSBMLkRvbVV0aWwuY3JlYXRlKCdidXR0b24nLCBuYW1lLCBjb250YWluZXIpO1xuICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXNbbmFtZV0oKSk7XG4gICAgTC5Eb21FdmVudC5kaXNhYmxlQ2xpY2tQcm9wYWdhdGlvbihidXR0b24pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBNYWtlcyB0aGUgcHJldiwgcGxheSwgcGF1c2UsIGFuZCBuZXh0IGJ1dHRvbnNcbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gY29udGFpbmVyIFRoZSBjb250YWluZXIgdG8gd2hpY2ggdG8gYWRkIHRoZSBidXR0b25zXG4gICAqL1xuICBfbWFrZUJ1dHRvbnMoY29udGFpbmVyKSB7XG4gICAgdGhpcy5fbWFrZUJ1dHRvbihjb250YWluZXIsICdwcmV2Jyk7XG4gICAgdGhpcy5fbWFrZUJ1dHRvbihjb250YWluZXIsICdwbGF5Jyk7XG4gICAgdGhpcy5fbWFrZUJ1dHRvbihjb250YWluZXIsICdwYXVzZScpO1xuICAgIHRoaXMuX21ha2VCdXR0b24oY29udGFpbmVyLCAnbmV4dCcpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIHRoZSByYW5nZSBpbnB1dFxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBjb250YWluZXIgVGhlIGNvbnRhaW5lciB0byB3aGljaCB0byBhZGQgdGhlIGlucHV0XG4gICAqL1xuICBfbWFrZVNsaWRlcihjb250YWluZXIpIHtcbiAgICBjb25zdCBzbGlkZXIgPSBMLkRvbVV0aWwuY3JlYXRlKCdpbnB1dCcsICd0aW1lLXNsaWRlcicsIGNvbnRhaW5lcik7XG4gICAgc2xpZGVyLnR5cGUgPSAncmFuZ2UnO1xuICAgIHNsaWRlci5taW4gPSB0aGlzLnN0YXJ0IHx8IDA7XG4gICAgc2xpZGVyLm1heCA9IHRoaXMuZW5kIHx8IDA7XG4gICAgc2xpZGVyLnZhbHVlID0gdGhpcy5zdGFydCB8fCAwO1xuICAgIHNsaWRlci5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZSkgPT4gdGhpcy5fc2xpZGVyQ2hhbmdlZChlKSk7XG4gICAgc2xpZGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgKGUpID0+IHRoaXMuX3NsaWRlckNoYW5nZWQoZSkpO1xuICAgIHNsaWRlci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoKSA9PiB0aGlzLm1hcC5kcmFnZ2luZy5kaXNhYmxlKCkpO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCAoKSA9PiB0aGlzLm1hcC5kcmFnZ2luZy5lbmFibGUoKSk7XG4gICAgdGhpcy5fdGltZVNsaWRlciA9IHNsaWRlcjtcbiAgfSxcblxuICBfbWFrZU91dHB1dChjb250YWluZXIpIHtcbiAgICB0aGlzLl9vdXRwdXQgPSBMLkRvbVV0aWwuY3JlYXRlKCdvdXRwdXQnLCAndGltZS10ZXh0JywgY29udGFpbmVyKTtcbiAgICB0aGlzLl9vdXRwdXQuaW5uZXJIVE1MID0gdGhpcy5vcHRpb25zLmZvcm1hdE91dHB1dCh0aGlzLnN0YXJ0KTtcbiAgfSxcblxuICBfb25LZXlkb3duKGUpIHtcbiAgICBzd2l0Y2ggKGUua2V5Q29kZSB8fCBlLndoaWNoKSB7XG4gICAgICBjYXNlIDM3OiB0aGlzLnByZXYoKTsgYnJlYWs7XG4gICAgICBjYXNlIDM5OiB0aGlzLm5leHQoKTsgYnJlYWs7XG4gICAgICBjYXNlIDMyOiB0aGlzLnRvZ2dsZSgpOyBicmVhaztcbiAgICAgIGRlZmF1bHQ6IHJldHVybjtcbiAgICB9XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICB9LFxuXG4gIF9zbGlkZXJDaGFuZ2VkKGUpIHtcbiAgICBjb25zdCB0aW1lID0gcGFyc2VGbG9hdChlLnRhcmdldC52YWx1ZSwgMTApO1xuICAgIHRoaXMudGltZSA9IHRpbWU7XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMud2FpdFRvVXBkYXRlTWFwIHx8IGUudHlwZSA9PT0gJ2NoYW5nZScpIHtcbiAgICAgIHRoaXMudGltZWxpbmVzLmZvckVhY2goKHRpbWVsaW5lKSA9PiB0aW1lbGluZS5zZXRUaW1lKHRpbWUpKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX291dHB1dCkge1xuICAgICAgdGhpcy5fb3V0cHV0LmlubmVySFRNTCA9IHRoaXMub3B0aW9ucy5mb3JtYXRPdXRwdXQodGltZSk7XG4gICAgfVxuICB9LFxuXG4gIC8qIEVYVEVSTkFMIEFQSSAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIC8qKlxuICAgKiBSZWdpc3RlciB0aW1lbGluZSBsYXllcnMgd2l0aCB0aGlzIGNvbnRyb2wuIFRoaXMgY291bGQgY2hhbmdlIHRoZSBzdGFydCBhbmRcbiAgICogZW5kIHBvaW50cyBvZiB0aGUgdGltZWxpbmUgKHVubGVzcyBtYW51YWxseSBzZXQpLiBJdCB3aWxsIGFsc28gcmVzZXQgdGhlXG4gICAqIHBsYXliYWNrLlxuICAgKlxuICAgKiBAcGFyYW0gey4uLkwuVGltZWxpbmV9IHRpbWVsaW5lcyBUaGUgYEwuVGltZWxpbmVgcyB0byByZWdpc3RlclxuICAgKi9cbiAgYWRkVGltZWxpbmVzKC4uLnRpbWVsaW5lcykge1xuICAgIHRoaXMucGF1c2UoKTtcbiAgICBjb25zdCB0aW1lbGluZUNvdW50ID0gdGhpcy50aW1lbGluZXMubGVuZ3RoO1xuICAgIHRpbWVsaW5lcy5mb3JFYWNoKCh0aW1lbGluZSkgPT4ge1xuICAgICAgaWYgKHRoaXMudGltZWxpbmVzLmluZGV4T2YodGltZWxpbmUpID09PSAtMSkge1xuICAgICAgICB0aGlzLnRpbWVsaW5lcy5wdXNoKHRpbWVsaW5lKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAodGhpcy50aW1lbGluZXMubGVuZ3RoICE9PSB0aW1lbGluZUNvdW50KSB7XG4gICAgICB0aGlzLl9yZWNhbGN1bGF0ZSgpO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5zaG93VGlja3MpIHtcbiAgICAgICAgdGhpcy5fcmVidWlsZERhdGFMaXN0KCk7XG4gICAgICB9XG4gICAgICB0aGlzLnNldFRpbWUodGhpcy5zdGFydCk7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBVbnJlZ2lzdGVyIHRpbWVsaW5lIGxheWVycyB3aXRoIHRoaXMgY29udHJvbC4gVGhpcyBjb3VsZCBjaGFuZ2UgdGhlIHN0YXJ0XG4gICAqIGFuZCBlbmQgcG9pbnRzIG9mIHRoZSB0aW1lbGluZSB1bmxlc3MgbWFudWFsbHkgc2V0LiBJdCB3aWxsIGFsc28gcmVzZXQgdGhlXG4gICAqIHBsYXliYWNrLlxuICAgKlxuICAgKiBAcGFyYW0gey4uLkwuVGltZWxpbmV9IHRpbWVsaW5lcyBUaGUgYEwuVGltZWxpbmVgcyB0byB1bnJlZ2lzdGVyXG4gICAqL1xuICByZW1vdmVUaW1lbGluZXMoLi4udGltZWxpbmVzKSB7XG4gICAgdGhpcy5wYXVzZSgpO1xuICAgIGNvbnN0IHRpbWVsaW5lQ291bnQgPSB0aGlzLnRpbWVsaW5lcy5sZW5ndGg7XG4gICAgdGltZWxpbmVzLmZvckVhY2goKHRpbWVsaW5lKSA9PiB7XG4gICAgICBjb25zdCBpbmRleCA9IHRoaXMudGltZWxpbmVzLmluZGV4T2YodGltZWxpbmUpO1xuICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICB0aGlzLnRpbWVsaW5lcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmICh0aGlzLnRpbWVsaW5lcy5sZW5ndGggIT09IHRpbWVsaW5lQ291bnQpIHtcbiAgICAgIHRoaXMuX3JlY2FsY3VsYXRlKCk7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLnNob3dUaWNrcykge1xuICAgICAgICB0aGlzLl9yZWJ1aWxkRGF0YUxpc3QoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2V0VGltZSh0aGlzLnN0YXJ0KTtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIFRvZ2dsZXMgcGxheS9wYXVzZSBzdGF0ZS5cbiAgICovXG4gIHRvZ2dsZSgpIHtcbiAgICBpZiAodGhpcy5fcGxheWluZykge1xuICAgICAgdGhpcy5wYXVzZSgpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMucGxheSgpO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogUGF1c2VzIHBsYXliYWNrIGFuZCBnb2VzIHRvIHRoZSBwcmV2aW91cyBldmVudC5cbiAgICovXG4gIHByZXYoKSB7XG4gICAgdGhpcy5wYXVzZSgpO1xuICAgIGNvbnN0IHByZXZUaW1lID0gdGhpcy5fbmVhcmVzdEV2ZW50VGltZSh0aGlzLnRpbWUsIC0xKTtcbiAgICB0aGlzLl90aW1lU2xpZGVyLnZhbHVlID0gcHJldlRpbWU7XG4gICAgdGhpcy5zZXRUaW1lKHByZXZUaW1lKTtcbiAgfSxcblxuICAvKipcbiAgICogUGF1c2VzIHBsYXliYWNrLlxuICAgKi9cbiAgcGF1c2UoKSB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuX3RpbWVyKTtcbiAgICB0aGlzLl9wbGF5aW5nID0gZmFsc2U7XG4gICAgdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LnJlbW92ZSgncGxheWluZycpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBTdGFydHMgcGxheWJhY2suXG4gICAqL1xuICBwbGF5KCkge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLl90aW1lcik7XG4gICAgaWYgKHBhcnNlRmxvYXQodGhpcy5fdGltZVNsaWRlci52YWx1ZSwgMTApID09PSB0aGlzLmVuZCkge1xuICAgICAgdGhpcy5fdGltZVNsaWRlci52YWx1ZSA9IHRoaXMuc3RhcnQ7XG4gICAgfVxuICAgIHRoaXMuX3RpbWVTbGlkZXIudmFsdWUgPSBwYXJzZUZsb2F0KHRoaXMuX3RpbWVTbGlkZXIudmFsdWUsIDEwKVxuICAgICAgKyB0aGlzLl9zdGVwU2l6ZTtcbiAgICB0aGlzLnNldFRpbWUodGhpcy5fdGltZVNsaWRlci52YWx1ZSk7XG4gICAgaWYgKHBhcnNlRmxvYXQodGhpcy5fdGltZVNsaWRlci52YWx1ZSwgMTApID09PSB0aGlzLmVuZCkge1xuICAgICAgdGhpcy5fcGxheWluZyA9IGZhbHNlO1xuICAgICAgdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LnJlbW92ZSgncGxheWluZycpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMuX3BsYXlpbmcgPSB0cnVlO1xuICAgICAgdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LmFkZCgncGxheWluZycpO1xuICAgICAgdGhpcy5fdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMucGxheSgpLCB0aGlzLl9zdGVwRHVyYXRpb24pO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogUGF1c2VzIHBsYXliYWNrIGFuZCBnb2VzIHRvIHRoZSBuZXh0IGV2ZW50LlxuICAgKi9cbiAgbmV4dCgpIHtcbiAgICB0aGlzLnBhdXNlKCk7XG4gICAgY29uc3QgbmV4dFRpbWUgPSB0aGlzLl9uZWFyZXN0RXZlbnRUaW1lKHRoaXMudGltZSwgMSk7XG4gICAgdGhpcy5fdGltZVNsaWRlci52YWx1ZSA9IG5leHRUaW1lO1xuICAgIHRoaXMuc2V0VGltZShuZXh0VGltZSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFNldCB0aGUgdGltZSBkaXNwbGF5ZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB0aW1lIFRoZSB0aW1lIHRvIHNldFxuICAgKi9cbiAgc2V0VGltZSh0aW1lKSB7XG4gICAgdGhpcy5fc2xpZGVyQ2hhbmdlZCh7XG4gICAgICB0eXBlOiAnY2hhbmdlJyxcbiAgICAgIHRhcmdldDoge3ZhbHVlOiB0aW1lfSxcbiAgICB9KTtcbiAgfSxcblxuICBvbkFkZChtYXApIHtcbiAgICB0aGlzLm1hcCA9IG1hcDtcbiAgICB0aGlzLl9jcmVhdGVET00oKTtcbiAgICB0aGlzLnNldFRpbWUodGhpcy5zdGFydCk7XG4gICAgcmV0dXJuIHRoaXMuY29udGFpbmVyO1xuICB9LFxuXG4gIG9uUmVtb3ZlKCkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMuZW5hYmxlS2V5Ym9hcmRDb250cm9scykge1xuICAgICAgdGhpcy5fcmVtb3ZlS2V5TGlzdGVuZXJzKCk7XG4gICAgfVxuICB9LFxufSk7XG5cbkwudGltZWxpbmVTbGlkZXJDb250cm9sID0gKHRpbWVsaW5lLCBzdGFydCwgZW5kLCB0aW1lbGlzdCkgPT5cbiAgbmV3IEwuVGltZWxpbmVTbGlkZXJDb250cm9sKHRpbWVsaW5lLCBzdGFydCwgZW5kLCB0aW1lbGlzdCk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9UaW1lbGluZVNsaWRlckNvbnRyb2wuanNcbiAqKi8iLCIvLyByZW1vdmVkIGJ5IGV4dHJhY3QtdGV4dC13ZWJwYWNrLXBsdWdpblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvbGVhZmxldC50aW1lbGluZS5zYXNzXG4gKiogbW9kdWxlIGlkID0gNFxuICoqIG1vZHVsZSBjaHVua3MgPSAwIDFcbiAqKi8iXSwic291cmNlUm9vdCI6IiJ9