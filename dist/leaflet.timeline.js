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
	
	var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }(); /* global L */
	
	var _IntervalTree = __webpack_require__(2);
	
	var _IntervalTree2 = _interopRequireDefault(_IntervalTree);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
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
	    var _this3 = this;
	
	    // This loop is intended to help optimize things a bit. First, we find all
	    // the features that should be displayed at the current time.
	    var features = this.ranges.lookup(this.time);
	    // Then we try to match each currently displayed layer up to a feature. If
	    // we find a match, then we remove it from the feature list. If we don't
	    // find a match, then the displayed layer is no longer valid at this time.
	    // We should remove it.
	    for (var i = 0; i < this.getLayers().length; i++) {
	      var found = false;
	      var layer = this.getLayers()[i];
	      for (var j = 0; j < features.length; j++) {
	        if (layer.feature === features[j]) {
	          found = true;
	          features.splice(j, 1);
	          break;
	        }
	      }
	      if (!found) {
	        var toRemove = this.getLayers()[i--];
	        this.removeLayer(toRemove);
	      }
	    }
	    // Finally, with any features left, they must be new data! We can add them.
	    features.forEach(function (feature) {
	      return _this3.addData(feature);
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
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
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
	
	var IntervalTree = function () {
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
	      var newNode = void 0;
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
	}();

	exports.default = IntervalTree;

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
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
	      var _ret = function () {
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
	      }();
	
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgNTljNTkxY2Y5ZjVlNjY5MTI3MzEiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL3NyYy9UaW1lbGluZS5qcyIsIndlYnBhY2s6Ly8vLi9+L2RpZXNhbC9zcmMvZHMvSW50ZXJ2YWxUcmVlLmpzIiwid2VicGFjazovLy8uL3NyYy9UaW1lbGluZVNsaWRlckNvbnRyb2wuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xlYWZsZXQudGltZWxpbmUuc2FzcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsdUJBQWU7QUFDZjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7Ozs7Ozs7QUNwQ0EsR0FBRSxlQUFGLEdBQW9CLFlBQXBCOztBQUVBLHFCQUFRLENBQVI7QUFDQSxxQkFBUSxDQUFSOzs7QUFHQSxxQkFBUSxDQUFSLEU7Ozs7Ozs7Ozs7QUNOQTs7Ozs7O0FBRUEsR0FBRSxRQUFGLEdBQWEsRUFBRSxPQUFGLENBQVUsTUFBVixDQUFpQjtBQUM1QixVQUFPLEVBQVA7QUFDQSxXQUFRLElBQVI7Ozs7Ozs7Ozs7Ozs7QUFhQSxtQ0FBVyxTQUF1Qjs7O1NBQWQsZ0VBQVUsa0JBQUk7Ozs7O0FBSWhDLFVBQUssTUFBTCxHQUFjLDRCQUFkLENBSmdDO0FBS2hDLFNBQU0sU0FBUyw4Q0FBVCxDQUwwQjs7d0JBTU4sT0FBTyxJQUFQLENBQVksRUFBRSxPQUFGLEVBTk47Ozs7U0FNdkIseUJBTnVCO1NBTWYseUJBTmU7O0FBT2hDLFVBQUssWUFBTCxHQUFvQixTQUFTLEtBQVQsRUFBZ0IsRUFBaEIsTUFBd0IsQ0FBeEIsSUFBNkIsU0FBUyxLQUFULEVBQWdCLEVBQWhCLEtB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VztBQUNULFNBQUksS0FBSyxPQUFMLENBQWEsc0JBQWIsRUFBcUM7QUFDdkMsWUFBSyxtQkFBTCxHQUR1QztNQUF6QztJQTVidUM7RUFBakIsQ0FBMUI7O0FBa2NBLEdBQUUscUJBQUYsR0FBMEIsVUFBQyxRQUFELEVBQVcsS0FBWCxFQUFrQixHQUFsQixFQUF1QixRQUF2QjtVQUN4QixJQUFJLEVBQUUscUJBQUYsQ0FBd0IsUUFBNUIsRUFBc0MsS0FBdEMsRUFBNkMsR0FBN0MsRUFBa0QsUUFBbEQ7RUFEd0IsQzs7Ozs7O0FDeGMxQiwwQyIsImZpbGUiOiJsZWFmbGV0LnRpbWVsaW5lLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pXG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGV4cG9ydHM6IHt9LFxuIFx0XHRcdGlkOiBtb2R1bGVJZCxcbiBcdFx0XHRsb2FkZWQ6IGZhbHNlXG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiB3ZWJwYWNrL2Jvb3RzdHJhcCA1OWM1OTFjZjlmNWU2NjkxMjczMVxuICoqLyIsIi8qIGdsb2JhbCByZXF1aXJlLCBMICovXG5cbkwuVGltZWxpbmVWZXJzaW9uID0gJzEuMC4wLWJldGEnO1xuXG5yZXF1aXJlKCcuL1RpbWVsaW5lLmpzJyk7XG5yZXF1aXJlKCcuL1RpbWVsaW5lU2xpZGVyQ29udHJvbC5qcycpO1xuXG4vLyB3ZWJwYWNrIHJlcXVpcmVzXG5yZXF1aXJlKCcuL2xlYWZsZXQudGltZWxpbmUuc2FzcycpO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvaW5kZXguanNcbiAqKi8iLCIvKiBnbG9iYWwgTCAqL1xuXG5pbXBvcnQgSW50ZXJ2YWxUcmVlIGZyb20gJ2RpZXNhbC9zcmMvZHMvSW50ZXJ2YWxUcmVlJztcblxuTC5UaW1lbGluZSA9IEwuR2VvSlNPTi5leHRlbmQoe1xuICB0aW1lczogW10sXG4gIHJhbmdlczogbnVsbCxcblxuICAvKipcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBnZW9qc29uIFRoZSBHZW9KU09OIGRhdGEgZm9yIHRoaXMgbGF5ZXJcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgSGFzaCBvZiBvcHRpb25zXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IFtvcHRpb25zLmdldEludGVydmFsXSBBIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgYW4gb2JqZWN0XG4gICAqIHdpdGggYHN0YXJ0YCBhbmQgYGVuZGAgcHJvcGVydGllcywgY2FsbGVkIGZvciBlYWNoIGZlYXR1cmUgaW4gdGhlIEdlb0pTT05cbiAgICogZGF0YS5cbiAgICogQHBhcmFtIHtCb29sZWFufSBbb3B0aW9ucy5kcmF3T25TZXRUaW1lPXRydWVdIE1ha2UgdGhlIGxheWVyIGRyYXcgYXMgc29vblxuICAgKiBhcyBgc2V0VGltZWAgaXMgY2FsbGVkLiBJZiB0aGlzIGlzIHNldCB0byBmYWxzZSwgeW91IHdpbGwgbmVlZCB0byBjYWxsXG4gICAqIGB1cGRhdGVEaXNwbGF5ZWRMYXllcnMoKWAgbWFudWFsbHkuXG4gICAqL1xuICBpbml0aWFsaXplKGdlb2pzb24sIG9wdGlvbnMgPSB7fSkge1xuICAgIC8vIFNvbWUgZnVuY3Rpb25hbGl0eSB3YXMgY2hhbmdlZCBhZnRlciBMZWFmbGV0IDAuNzsgc29tZSBwZW9wbGUgdXNlIHRoZVxuICAgIC8vIGxhdGVzdCBzdGFibGUsIHNvbWUgdXNlIHRoZSBiZXRhLiBUaGlzIHNob3VsZCB3b3JrIGVpdGhlciB3YXksIHNvIHdlIG5lZWRcbiAgICAvLyBhIHZlcnNpb24gY2hlY2suXG4gICAgdGhpcy5yYW5nZXMgPSBuZXcgSW50ZXJ2YWxUcmVlKCk7XG4gICAgY29uc3Qgc2VtdmVyID0gL14oXFxkKykoXFwuKFxcZCspKT8oXFwuKFxcZCspKT8oLSguKikpPyhcXCsoLiopKT8kLztcbiAgICBjb25zdCBbLCBtYWpvciwsIG1pbm9yXSA9IHNlbXZlci5leGVjKEwudmVyc2lvbik7XG4gICAgdGhpcy5pc09sZFZlcnNpb24gPSBwYXJzZUludChtYWpvciwgMTApID09PSAwICYmIHBhcnNlSW50KG1pbm9yLCAxMCkgPD0gNztcbiAgICBjb25zdCBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICAgIGRyYXdPblNldFRpbWU6IHRydWUsXG4gICAgfTtcbiAgICBMLkdlb0pTT04ucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCh0aGlzLCBudWxsLCBvcHRpb25zKTtcbiAgICBMLlV0aWwuc2V0T3B0aW9ucyh0aGlzLCBkZWZhdWx0T3B0aW9ucyk7XG4gICAgTC5VdGlsLnNldE9wdGlvbnModGhpcywgb3B0aW9ucyk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5nZXRJbnRlcnZhbCkge1xuICAgICAgdGhpcy5fZ2V0SW50ZXJ2YWwgPSAoLi4uYXJncykgPT4gdGhpcy5vcHRpb25zLmdldEludGVydmFsKC4uLmFyZ3MpO1xuICAgIH1cbiAgICBpZiAoZ2VvanNvbikge1xuICAgICAgdGhpcy5fcHJvY2VzcyhnZW9qc29uKTtcbiAgICB9XG4gIH0sXG5cbiAgX2dldEludGVydmFsKGZlYXR1cmUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3RhcnQ6IG5ldyBEYXRlKGZlYXR1cmUucHJvcGVydGllcy5zdGFydCkuZ2V0VGltZSgpLFxuICAgICAgZW5kOiBuZXcgRGF0ZShmZWF0dXJlLnByb3BlcnRpZXMuZW5kKS5nZXRUaW1lKCksXG4gICAgfTtcbiAgfSxcblxuICAvKipcbiAgICogRmluZHMgdGhlIGZpcnN0IGFuZCBsYXN0IHRpbWVzIGluIHRoZSBkYXRhc2V0LCBhZGRzIGFsbCB0aW1lcyBpbnRvIGFuXG4gICAqIGFycmF5LCBhbmQgcHV0cyBldmVyeXRoaW5nIGludG8gYW4gSW50ZXJ2YWxUcmVlIGZvciBxdWljayBsb29rdXAuXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIEdlb0pTT04gdG8gcHJvY2Vzc1xuICAgKi9cbiAgX3Byb2Nlc3MoZGF0YSkge1xuICAgIC8vIEluIGNhc2Ugd2UgZG9uJ3QgaGF2ZSBhIG1hbnVhbGx5IHNldCBzdGFydCBvciBlbmQgdGltZSwgd2UgbmVlZCB0byBmaW5kXG4gICAgLy8gdGhlIGV4dHJlbWVzIGluIHRoZSBkYXRhLiBXZSBjYW4gZG8gdGhhdCB3aGlsZSB3ZSdyZSBpbnNlcnRpbmcgZXZlcnl0aGluZ1xuICAgIC8vIGludG8gdGhlIGludGVydmFsIHRyZWUuXG4gICAgbGV0IHN0YXJ0ID0gSW5maW5pdHk7XG4gICAgbGV0IGVuZCA9IC1JbmZpbml0eTtcbiAgICBkYXRhLmZlYXR1cmVzLmZvckVhY2goKGZlYXR1cmUpID0+IHtcbiAgICAgIGNvbnN0IGludGVydmFsID0gdGhpcy5fZ2V0SW50ZXJ2YWwoZmVhdHVyZSk7XG4gICAgICB0aGlzLnJhbmdlcy5pbnNlcnQoaW50ZXJ2YWwuc3RhcnQsIGludGVydmFsLmVuZCwgZmVhdHVyZSk7XG4gICAgICB0aGlzLnRpbWVzLnB1c2goaW50ZXJ2YWwuc3RhcnQpO1xuICAgICAgdGhpcy50aW1lcy5wdXNoKGludGVydmFsLmVuZCk7XG4gICAgICBzdGFydCA9IE1hdGgubWluKHN0YXJ0LCBpbnRlcnZhbC5zdGFydCk7XG4gICAgICBlbmQgPSBNYXRoLm1heChlbmQsIGludGVydmFsLmVuZCk7XG4gICAgfSk7XG4gICAgdGhpcy5zdGFydCA9IHRoaXMub3B0aW9ucy5zdGFydCB8fCBzdGFydDtcbiAgICB0aGlzLmVuZCA9IHRoaXMub3B0aW9ucy5lbmQgfHwgZW5kO1xuICAgIHRoaXMudGltZSA9IHRoaXMuc3RhcnQ7XG4gICAgaWYgKHRoaXMudGltZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIGRlZmF1bHQgc29ydCBpcyBsZXhpY29ncmFwaGljLCBldmVuIGZvciBudW1iZXIgdHlwZXMuIHNvIG5lZWQgdG9cbiAgICAvLyBzcGVjaWZ5IHNvcnRpbmcgZnVuY3Rpb24uXG4gICAgdGhpcy50aW1lcy5zb3J0KChhLCBiKSA9PiBhIC0gYik7XG4gICAgLy8gZGUtZHVwbGljYXRlIHRoZSB0aW1lc1xuICAgIHRoaXMudGltZXMgPSB0aGlzLnRpbWVzLnJlZHVjZSgobmV3TGlzdCwgeCwgaSkgPT4ge1xuICAgICAgaWYgKGkgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIG5ld0xpc3Q7XG4gICAgICB9XG4gICAgICBjb25zdCBsYXN0VGltZSA9IG5ld0xpc3RbbmV3TGlzdC5sZW5ndGggLSAxXTtcbiAgICAgIGlmIChsYXN0VGltZSAhPT0geCkge1xuICAgICAgICBuZXdMaXN0LnB1c2goeCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3TGlzdDtcbiAgICB9LCBbdGhpcy50aW1lc1swXV0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB0aW1lIGZvciB0aGlzIGxheWVyLlxuICAgKlxuICAgKiBAcGFyYW0ge051bWJlcnxTdHJpbmd9IHRpbWUgVGhlIHRpbWUgdG8gc2V0LiBVc3VhbGx5IGEgbnVtYmVyLCBidXQgaWYgeW91clxuICAgKiBkYXRhIGlzIHJlYWxseSB0aW1lLWJhc2VkIHRoZW4geW91IGNhbiBwYXNzIGEgc3RyaW5nIChlLmcuICcyMDE1LTAxLTAxJylcbiAgICogYW5kIGl0IHdpbGwgYmUgcHJvY2Vzc2VkIGludG8gYSBudW1iZXIgYXV0b21hdGljYWxseS5cbiAgICovXG4gIHNldFRpbWUodGltZSkge1xuICAgIHRoaXMudGltZSA9IHR5cGVvZiB0aW1lID09PSAnbnVtYmVyJyA/IHRpbWUgOiBuZXcgRGF0ZSh0aW1lKS5nZXRUaW1lKCk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5kcmF3T25TZXRUaW1lKSB7XG4gICAgICB0aGlzLnVwZGF0ZURpc3BsYXllZExheWVycygpO1xuICAgIH1cbiAgICB0aGlzLmZpcmUoJ2NoYW5nZScpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIGxheWVyIHRvIHNob3cgb25seSB0aGUgZmVhdHVyZXMgdGhhdCBhcmUgcmVsZXZhbnQgYXQgdGhlIGN1cnJlbnRcbiAgICogdGltZS4gVXN1YWxseSBzaG91bGRuJ3QgbmVlZCB0byBiZSBjYWxsZWQgbWFudWFsbHksIHVubGVzcyB5b3Ugc2V0XG4gICAqIGBkcmF3T25TZXRUaW1lYCB0byBgZmFsc2VgLlxuICAgKi9cbiAgdXBkYXRlRGlzcGxheWVkTGF5ZXJzKCkge1xuICAgIC8vIFRoaXMgbG9vcCBpcyBpbnRlbmRlZCB0byBoZWxwIG9wdGltaXplIHRoaW5ncyBhIGJpdC4gRmlyc3QsIHdlIGZpbmQgYWxsXG4gICAgLy8gdGhlIGZlYXR1cmVzIHRoYXQgc2hvdWxkIGJlIGRpc3BsYXllZCBhdCB0aGUgY3VycmVudCB0aW1lLlxuICAgIGNvbnN0IGZlYXR1cmVzID0gdGhpcy5yYW5nZXMubG9va3VwKHRoaXMudGltZSk7XG4gICAgLy8gVGhlbiB3ZSB0cnkgdG8gbWF0Y2ggZWFjaCBjdXJyZW50bHkgZGlzcGxheWVkIGxheWVyIHVwIHRvIGEgZmVhdHVyZS4gSWZcbiAgICAvLyB3ZSBmaW5kIGEgbWF0Y2gsIHRoZW4gd2UgcmVtb3ZlIGl0IGZyb20gdGhlIGZlYXR1cmUgbGlzdC4gSWYgd2UgZG9uJ3RcbiAgICAvLyBmaW5kIGEgbWF0Y2gsIHRoZW4gdGhlIGRpc3BsYXllZCBsYXllciBpcyBubyBsb25nZXIgdmFsaWQgYXQgdGhpcyB0aW1lLlxuICAgIC8vIFdlIHNob3VsZCByZW1vdmUgaXQuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmdldExheWVycygpLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgICAgIGNvbnN0IGxheWVyID0gdGhpcy5nZXRMYXllcnMoKVtpXTtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZmVhdHVyZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKGxheWVyLmZlYXR1cmUgPT09IGZlYXR1cmVzW2pdKSB7XG4gICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgIGZlYXR1cmVzLnNwbGljZShqLCAxKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICBjb25zdCB0b1JlbW92ZSA9IHRoaXMuZ2V0TGF5ZXJzKClbaS0tXTtcbiAgICAgICAgdGhpcy5yZW1vdmVMYXllcih0b1JlbW92ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIEZpbmFsbHksIHdpdGggYW55IGZlYXR1cmVzIGxlZnQsIHRoZXkgbXVzdCBiZSBuZXcgZGF0YSEgV2UgY2FuIGFkZCB0aGVtLlxuICAgIGZlYXR1cmVzLmZvckVhY2goKGZlYXR1cmUpID0+IHRoaXMuYWRkRGF0YShmZWF0dXJlKSk7XG4gIH1cblxufSk7XG5cbkwudGltZWxpbmUgPSAoZ2VvanNvbiwgb3B0aW9ucykgPT4gbmV3IEwuVGltZWxpbmUoZ2VvanNvbiwgb3B0aW9ucyk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9UaW1lbGluZS5qc1xuICoqLyIsIlxuLyoqXG4gKiBBIG5vZGUgaW4gdGhlIGludGVydmFsIHRyZWUuXG4gKlxuICogQHByb3BlcnR5IHtOdW1iZXJ9IGxvdyBTdGFydCBvZiB0aGUgaW50ZXJ2YWxcbiAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBoaWdoIEVuZCBvZiB0aGUgaW50ZXJ2YWxcbiAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBtYXggVGhlIGdyZWF0ZXN0IGVuZHBvaW50IG9mIHRoaXMgbm9kZSdzIGludGVydmFsIG9yIGFueVxuICogb2YgaXRzIGNoaWxkcmVuLlxuICogQHByb3BlcnR5IHsqfSBkYXRhIFRoZSB2YWx1ZSBvZiB0aGUgaW50ZXJ2YWxcbiAqIEBwcm9wZXJ0eSB7SW50ZXJ2YWxUcmVlTm9kZT99IGxlZnQgTGVmdCBjaGlsZCAobG93ZXIgaW50ZXJ2YWxzKVxuICogQHByb3BlcnR5IHtJbnRlcnZhbFRyZWVOb2RlP30gcmlnaHQgUmlnaHQgY2hpbGQgKGhpZ2hlciBpbnRlcnZhbHMpXG4gKiBAcHJvcGVydHkge0ludGVydmFsVHJlZU5vZGU/fSBwYXJlbnQgVGhlIHBhcmVudCBvZiB0aGlzIG5vZGVcbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIEludGVydmFsVHJlZU5vZGUge1xuICBjb25zdHJ1Y3Rvcihsb3csIGhpZ2gsIGRhdGEsIHBhcmVudCkge1xuICAgIHRoaXMubG93ID0gbG93O1xuICAgIHRoaXMuaGlnaCA9IGhpZ2g7XG4gICAgdGhpcy5tYXggPSBoaWdoO1xuICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gICAgdGhpcy5sZWZ0ID0gbnVsbDtcbiAgICB0aGlzLnJpZ2h0ID0gbnVsbDtcbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBJbnRlcnZhbFRyZWUge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9yb290ID0gbnVsbDtcbiAgICB0aGlzLnNpemUgPSAwO1xuICB9XG5cbiAgLyoqXG4gICAqIEFjdHVhbGx5IGluc2VydCBhIG5ldyBpbnRlcnZhbCBpbnRvIHRoZSB0cmVlLiBUaGlzIGhhcyBhIGZldyBleHRyYVxuICAgKiBhcmd1bWVudHMgdGhhdCBkb24ndCByZWFsbHkgbmVlZCB0byBiZSBleHBvc2VkIGluIHRoZSBwdWJsaWMgQVBJLCBoZW5jZSB0aGVcbiAgICogc2VwYXJhdGlvbi5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGJlZ2luIFN0YXJ0IG9mIHRoZSBpbnRlcnZhbFxuICAgKiBAcGFyYW0ge051bWJlcn0gZW5kIEVuZCBvZiB0aGUgaW50ZXJ2YWxcbiAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgb2YgdGhlIGludGVydmFsXG4gICAqIEBwYXJhbSB7SW50ZXJ2YWxUcmVlTm9kZT99IG5vZGUgVGhlIGN1cnJlbnQgcGxhY2Ugd2UgYXJlIGxvb2tpbmcgYXQgdG8gYWRkXG4gICAqIHRoZSBpbnRlcnZhbFxuICAgKiBAcGFyYW0ge0ludGVydmFsVHJlZU5vZGU/fSBwYXJlbnQgVGhlIHBhcmVudCBvZiB0aGUgcGxhY2Ugd2UgYXJlIGxvb2tpbmcgdG9cbiAgICogYWRkIHRoZSBpbnRlcnZhbFxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGFyZW50U2lkZSBUaGUgc2lkZSBvZiB0aGUgcGFyZW50IHdlJ3JlIGxvb2tpbmcgYXRcbiAgICogQHJldHVybnMge0ludGVydmFsVHJlZU5vZGV9IFRoZSBuZXdseSBhZGRlZCBub2RlXG4gICAqL1xuICBfaW5zZXJ0KGJlZ2luLCBlbmQsIHZhbHVlLCBub2RlLCBwYXJlbnQsIHBhcmVudFNpZGUpIHtcbiAgICBsZXQgbmV3Tm9kZTtcbiAgICBpZiAobm9kZSA9PT0gbnVsbCkge1xuICAgICAgLy8gVGhlIHBsYWNlIHdlJ3JlIGxvb2tpbmcgYXQgaXMgYXZhaWxhYmxlOyBsZXQncyBwdXQgb3VyIG5vZGUgaGVyZS5cbiAgICAgIG5ld05vZGUgPSBuZXcgSW50ZXJ2YWxUcmVlTm9kZShiZWdpbiwgZW5kLCB2YWx1ZSwgcGFyZW50KTtcbiAgICAgIGlmIChwYXJlbnQgPT09IG51bGwpIHtcbiAgICAgICAgLy8gTm8gcGFyZW50PyBNdXN0IGJlIHJvb3QuXG4gICAgICAgIHRoaXMuX3Jvb3QgPSBuZXdOb2RlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIC8vIExldCB0aGUgcGFyZW50IGtub3cgYWJvdXQgaXRzIG5ldyBjaGlsZFxuICAgICAgICBwYXJlbnRbcGFyZW50U2lkZV0gPSBuZXdOb2RlO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIC8vIE5vIHZhY2FuY2llcy4gRmlndXJlIG91dCB3aGljaCBzaWRlIHdlIHNob3VsZCBiZSBwdXR0aW5nIG91ciBpbnRlcnZhbCxcbiAgICAgIC8vIGFuZCB0aGVuIHJlY3Vyc2UuXG4gICAgICBjb25zdCBzaWRlID0gKGJlZ2luIDwgbm9kZS5sb3cgfHwgYmVnaW4gPT09IG5vZGUubG93ICYmIGVuZCA8IG5vZGUuaGlnaClcbiAgICAgICAgPyAnbGVmdCdcbiAgICAgICAgOiAncmlnaHQnO1xuICAgICAgbmV3Tm9kZSA9IHRoaXMuX2luc2VydChiZWdpbiwgZW5kLCB2YWx1ZSwgbm9kZVtzaWRlXSwgbm9kZSwgc2lkZSk7XG4gICAgICBub2RlLm1heCA9IE1hdGgubWF4KG5vZGUubWF4LCBuZXdOb2RlLm1heCk7XG4gICAgfVxuICAgIHJldHVybiBuZXdOb2RlO1xuICB9XG5cbiAgLyoqXG4gICAqIEluc2VydCBhIG5ldyB2YWx1ZSBpbnRvIHRoZSB0cmVlLCBmb3IgdGhlIGdpdmVuIGludGVydmFsLlxuICAgKlxuICAgKiBAcGFyYW0ge051bWJlcn0gYmVnaW4gVGhlIHN0YXJ0IG9mIHRoZSB2YWxpZCBpbnRlcnZhbFxuICAgKiBAcGFyYW0ge051bWJlcn0gZW5kIFRoZSBlbmQgb2YgdGhlIHZhbGlkIGludGVydmFsXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIGZvciB0aGUgaW50ZXJ2YWxcbiAgICovXG4gIGluc2VydChiZWdpbiwgZW5kLCB2YWx1ZSkge1xuICAgIHRoaXMuX2luc2VydChiZWdpbiwgZW5kLCB2YWx1ZSwgdGhpcy5fcm9vdCwgdGhpcy5fcm9vdCk7XG4gICAgdGhpcy5zaXplKys7XG4gIH1cblxuICAvKipcbiAgICogRmluZCBhbGwgaW50ZXJ2YWxzIHRoYXQgY292ZXIgYSBjZXJ0YWluIHBvaW50LlxuICAgKlxuICAgKiBAcGFyYW0ge051bWJlcn0gcG9pbnQgVGhlIHNvdWdodCBwb2ludFxuICAgKiBAcmV0dXJucyB7KltdfSBBbiBhcnJheSBvZiBhbGwgdmFsdWVzIHRoYXQgYXJlIHZhbGlkIGF0IHRoZSBnaXZlbiBwb2ludC5cbiAgICovXG4gIGxvb2t1cChwb2ludCkge1xuICAgIGNvbnN0IG92ZXJsYXBzID0gW107XG4gICAgbGV0IG5vZGUgPSB0aGlzLl9yb290O1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgICBub2RlID0gYXJndW1lbnRzWzFdO1xuICAgIH1cbiAgICBpZiAobm9kZSA9PT0gbnVsbCB8fCBub2RlLm1heCA8IHBvaW50KSB7XG4gICAgICByZXR1cm4gb3ZlcmxhcHM7XG4gICAgfVxuICAgIG92ZXJsYXBzLnB1c2goLi4udGhpcy5sb29rdXAocG9pbnQsIG5vZGUubGVmdCkpO1xuICAgIGlmIChub2RlLmxvdyA8PSBwb2ludCkge1xuICAgICAgaWYgKG5vZGUuaGlnaCA+PSBwb2ludCkge1xuICAgICAgICBvdmVybGFwcy5wdXNoKG5vZGUuZGF0YSk7XG4gICAgICB9XG4gICAgICBvdmVybGFwcy5wdXNoKC4uLnRoaXMubG9va3VwKHBvaW50LCBub2RlLnJpZ2h0KSk7XG4gICAgfVxuICAgIHJldHVybiBvdmVybGFwcztcbiAgfVxufVxuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L2RpZXNhbC9zcmMvZHMvSW50ZXJ2YWxUcmVlLmpzXG4gKiovIiwiLyogZ2xvYmFsIEwgKi9cblxuLypcbiAqIEBjbGFzc1xuICogQGV4dGVuZHMgTC5Db250cm9sXG4gKi9cbkwuVGltZWxpbmVTbGlkZXJDb250cm9sID0gTC5Db250cm9sLmV4dGVuZCh7XG4gIC8qKlxuICAgKiBAY29uc3RydWN0b3JcbiAgICogQHBhcmFtIHtOdW1iZXJ9IFtvcHRpb25zLmR1cmF0aW9uPTYwMDAwMF0gVGhlIGFtb3VudCBvZiB0aW1lIGEgY29tcGxldGVcbiAgICogcGxheWJhY2sgc2hvdWxkIHRha2UuIE5vdCBndWFyYW50ZWVkOyBpZiB0aGVyZSdzIGEgbG90IG9mIGRhdGEgb3JcbiAgICogY29tcGxpY2F0ZWQgcmVuZGVyaW5nLCBpdCB3aWxsIGxpa2VseSB3aW5kIHVwIHRha2luZyBsb25nZXIuXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gW29wdGlvbnMuZW5hYmxlS2V5Ym9hcmRDb250cm9scz1mYWxzZV0gQWxsb3cgcGxheWJhY2sgdG9cbiAgICogYmUgY29udHJvbGxlZCB1c2luZyB0aGUgc3BhY2ViYXIgKHBsYXkvcGF1c2UpIGFuZCByaWdodC9sZWZ0IGFycm93IGtleXNcbiAgICogKG5leHQvcHJldmlvdXMpLlxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IFtvcHRpb25zLmVuYWJsZVBsYXliYWNrPXRydWVdIFNob3cgcGxheWJhY2sgY29udHJvbHMgKGkuZS5cbiAgICogcHJldi9wbGF5L3BhdXNlL25leHQpLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbb3B0aW9ucy5mb3JtYXRPdXRwdXRdIEEgZnVuY3Rpb24gd2hpY2ggdGFrZXMgdGhlIGN1cnJlbnRcbiAgICogdGltZSB2YWx1ZSAodXN1YWxseSBhIFVuaXggdGltZXN0YW1wKSBhbmQgb3V0cHV0cyBhIHN0cmluZyB0aGF0IGlzXG4gICAqIGRpc3BsYXllZCBiZW5lYXRoIHRoZSBjb250cm9sIGJ1dHRvbnMuXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gW29wdGlvbnMuc2hvd1RpY2tzPXRydWVdIFNob3cgdGlja3Mgb24gdGhlIHRpbWVsaW5lIChpZlxuICAgKiB0aGUgYnJvd3NlciBzdXBwb3J0cyBpdCkuXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gW29wdGlvbnMud2FpdFRvVXBkYXRlTWFwPWZhbHNlXSBXYWl0IHVudGlsIHRoZSB1c2VyIGlzXG4gICAqIGZpbmlzaGVkIGNoYW5naW5nIHRoZSBkYXRlIHRvIHVwZGF0ZSB0aGUgbWFwLiBCeSBkZWZhdWx0LCBib3RoIHRoZSBtYXAgYW5kXG4gICAqIHRoZSBkYXRlIHVwZGF0ZSBmb3IgZXZlcnkgY2hhbmdlLiBXaXRoIGNvbXBsZXggZGF0YSwgdGhpcyBjYW4gc2xvdyB0aGluZ3NcbiAgICogZG93biwgc28gc2V0IHRoaXMgdG8gdHJ1ZSB0byBvbmx5IHVwZGF0ZSB0aGUgZGlzcGxheWVkIGRhdGUuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBbb3B0aW9ucy5zdGFydF0gVGhlIHN0YXJ0IHRpbWUgb2YgdGhlIHRpbWVsaW5lLiBJZiB1bnNldCxcbiAgICogdGhpcyB3aWxsIGJlIGNhbGN1bGF0ZWQgYXV0b21hdGljYWxseSBiYXNlZCBvbiB0aGUgdGltZWxpbmVzIHJlZ2lzdGVyZWQgdG9cbiAgICogdGhpcyBjb250cm9sLlxuICAgKiBAcGFyYW0ge051bWJlcn0gW29wdGlvbnMuZW5kXSBUaGUgZW5kIHRpbWUgb2YgdGhlIHRpbWVsaW5lLiBJZiB1bnNldCwgdGhpc1xuICAgKiB3aWxsIGJlIGNhbGN1bGF0ZWQgYXV0b21hdGljYWxseSBiYXNlZCBvbiB0aGUgdGltZWxpbmVzIHJlZ2lzdGVyZWQgdG8gdGhpc1xuICAgKiBjb250cm9sLlxuICAgKi9cbiAgaW5pdGlhbGl6ZShvcHRpb25zID0ge30pIHtcbiAgICBjb25zdCBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICAgIGR1cmF0aW9uOiAgICAgICAgICAgICAgIDEwMDAwLFxuICAgICAgZW5hYmxlS2V5Ym9hcmRDb250cm9sczogZmFsc2UsXG4gICAgICBlbmFibGVQbGF5YmFjazogICAgICAgICB0cnVlLFxuICAgICAgZm9ybWF0T3V0cHV0OiAgICAgICAgICAgKG91dHB1dCkgPT4gYCR7b3V0cHV0IHx8ICcnfWAsXG4gICAgICBzaG93VGlja3M6ICAgICAgICAgICAgICB0cnVlLFxuICAgICAgd2FpdFRvVXBkYXRlTWFwOiAgICAgICAgZmFsc2UsXG4gICAgICBwb3NpdGlvbjogICAgICAgICAgICAgICAnYm90dG9tbGVmdCcsXG4gICAgICBzdGVwczogICAgICAgICAgICAgICAgICAxMDAwLFxuICAgIH07XG4gICAgdGhpcy50aW1lbGluZXMgPSBbXTtcbiAgICBMLlV0aWwuc2V0T3B0aW9ucyh0aGlzLCBkZWZhdWx0T3B0aW9ucyk7XG4gICAgTC5VdGlsLnNldE9wdGlvbnModGhpcywgb3B0aW9ucyk7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zLnN0YXJ0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgdGhpcy5zdGFydCA9IG9wdGlvbnMuc3RhcnQ7XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5lbmQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aGlzLmVuZCA9IG9wdGlvbnMuZW5kO1xuICAgIH1cbiAgfSxcblxuICAvKiBJTlRFUk5BTCBBUEkgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICogQHJldHVybnMge051bWJlcltdfSBBIGZsYXQsIHNvcnRlZCBsaXN0IG9mIGFsbCB0aGUgdGltZXMgb2YgYWxsIGxheWVyc1xuICAgKi9cbiAgX2dldFRpbWVzKCkge1xuICAgIGNvbnN0IHRpbWVzID0gW107XG4gICAgdGhpcy50aW1lbGluZXMuZm9yRWFjaCgodGltZWxpbmUpID0+IHtcbiAgICAgIGNvbnN0IHRpbWVzSW5SYW5nZSA9IHRpbWVsaW5lLnRpbWVzXG4gICAgICAgIC5maWx0ZXIoKHRpbWUpID0+IHRpbWUgPj0gdGhpcy5zdGFydCAmJiB0aW1lIDw9IHRoaXMuZW5kKTtcbiAgICAgIHRpbWVzLnB1c2goLi4udGltZXNJblJhbmdlKTtcbiAgICB9KTtcbiAgICBpZiAodGltZXMubGVuZ3RoKSB7XG4gICAgICB0aW1lcy5zb3J0KChhLCBiKSA9PiBhIC0gYik7XG4gICAgICBjb25zdCBkZWR1cGVkVGltZXMgPSBbdGltZXNbMF1dO1xuICAgICAgdGltZXMucmVkdWNlKChhLCBiKSA9PiB7XG4gICAgICAgIGlmIChhICE9PSBiKSB7XG4gICAgICAgICAgZGVkdXBlZFRpbWVzLnB1c2goYik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGI7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBkZWR1cGVkVGltZXM7XG4gICAgfVxuICAgIHJldHVybiB0aW1lcztcbiAgfSxcblxuICAvKipcbiAgICogQWRqdXN0cyBzdGFydC9lbmQvc3RlcCBzaXplL2V0Yy4gU2hvdWxkIGJlIGNhbGxlZCBpZiBhbnkgb2YgdGhvc2UgbWlnaHRcbiAgICogY2hhbmdlIChlLmcuIHdoZW4gYWRkaW5nIGEgbmV3IGxheWVyKS5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9yZWNhbGN1bGF0ZSgpIHtcbiAgICBjb25zdCBtYW51YWxTdGFydCA9IHR5cGVvZiB0aGlzLm9wdGlvbnMuc3RhcnQgIT09ICd1bmRlZmluZWQnO1xuICAgIGNvbnN0IG1hbnVhbEVuZCA9IHR5cGVvZiB0aGlzLm9wdGlvbnMuZW5kICE9PSAndW5kZWZpbmVkJztcbiAgICBjb25zdCBkdXJhdGlvbiA9IHRoaXMub3B0aW9ucy5kdXJhdGlvbjtcbiAgICBsZXQgbWluID0gSW5maW5pdHk7XG4gICAgbGV0IG1heCA9IC1JbmZpbml0eTtcbiAgICB0aGlzLnRpbWVsaW5lcy5mb3JFYWNoKCh0aW1lbGluZSkgPT4ge1xuICAgICAgaWYgKHRpbWVsaW5lLnN0YXJ0IDwgbWluKSB7XG4gICAgICAgIG1pbiA9IHRpbWVsaW5lLnN0YXJ0O1xuICAgICAgfVxuICAgICAgaWYgKHRpbWVsaW5lLmVuZCA+IG1heCkge1xuICAgICAgICBtYXggPSB0aW1lbGluZS5lbmQ7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKCFtYW51YWxTdGFydCkge1xuICAgICAgdGhpcy5zdGFydCA9IG1pbjtcbiAgICAgIHRoaXMuX3RpbWVTbGlkZXIubWluID0gbWluID09PSBJbmZpbml0eSA/IDAgOiBtaW47XG4gICAgICB0aGlzLl90aW1lU2xpZGVyLnZhbHVlID0gdGhpcy5fdGltZVNsaWRlci5taW47XG4gICAgfVxuICAgIGlmICghbWFudWFsRW5kKSB7XG4gICAgICB0aGlzLmVuZCA9IG1heDtcbiAgICAgIHRoaXMuX3RpbWVTbGlkZXIubWF4ID0gbWF4ID09PSAtSW5maW5pdHkgPyAwIDogbWF4O1xuICAgIH1cbiAgICB0aGlzLl9zdGVwU2l6ZSA9IE1hdGgubWF4KDEsICh0aGlzLmVuZCAtIHRoaXMuc3RhcnQpIC8gdGhpcy5vcHRpb25zLnN0ZXBzKTtcbiAgICB0aGlzLl9zdGVwRHVyYXRpb24gPSBNYXRoLm1heCgxLCBkdXJhdGlvbiAvIHRoaXMub3B0aW9ucy5zdGVwcyk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIElmIGBtb2RlYCBpcyAwLCBmaW5kcyB0aGUgZXZlbnQgbmVhcmVzdCB0byBgZmluZFRpbWVgLlxuICAgKlxuICAgKiBJZiBgbW9kZWAgaXMgMSwgZmluZHMgdGhlIGV2ZW50IGltbWVkaWF0ZWx5IGFmdGVyIGBmaW5kVGltZWAuXG4gICAqXG4gICAqIElmIGBtb2RlYCBpcyAtMSwgZmluZHMgdGhlIGV2ZW50IGltbWVkaWF0ZWx5IGJlZm9yZSBgZmluZFRpbWVgLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge051bWJlcn0gZmluZFRpbWUgVGhlIHRpbWUgdG8gZmluZCBldmVudHMgYXJvdW5kXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBtb2RlIFRoZSBvcGVyYXRpbmcgbW9kZS4gU2VlIG1haW4gZnVuY3Rpb24gZGVzY3JpcHRpb24uXG4gICAqIEByZXR1cm5zIHtOdW1iZXJ9IFRoZSB0aW1lIG9mIHRoZSBuZWFyZXN0IGV2ZW50LlxuICAgKi9cbiAgX25lYXJlc3RFdmVudFRpbWUoZmluZFRpbWUsIG1vZGUgPSAwKSB7XG4gICAgY29uc3QgdGltZXMgPSB0aGlzLl9nZXRUaW1lcygpO1xuICAgIGxldCByZXROZXh0ID0gZmFsc2U7XG4gICAgbGV0IGxhc3RUaW1lID0gdGltZXNbMF07XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCB0aW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgdGltZSA9IHRpbWVzW2ldO1xuICAgICAgaWYgKHJldE5leHQpIHtcbiAgICAgICAgcmV0dXJuIHRpbWU7XG4gICAgICB9XG4gICAgICBpZiAodGltZSA+PSBmaW5kVGltZSkge1xuICAgICAgICBpZiAobW9kZSA9PT0gLTEpIHtcbiAgICAgICAgICByZXR1cm4gbGFzdFRpbWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobW9kZSA9PT0gMSkge1xuICAgICAgICAgIGlmICh0aW1lID09PSBmaW5kVGltZSkge1xuICAgICAgICAgICAgcmV0TmV4dCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRpbWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHByZXZEaWZmID0gTWF0aC5hYnMoZmluZFRpbWUgLSBsYXN0VGltZSk7XG4gICAgICAgICAgY29uc3QgbmV4dERpZmYgPSBNYXRoLmFicyhmaW5kVGltZSAtIHRpbWUpO1xuICAgICAgICAgIHJldHVybiBwcmV2RGlmZiA8IG5leHREaWZmID8gbGFzdFRpbWUgOiB0aW1lO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBsYXN0VGltZSA9IHRpbWU7XG4gICAgfVxuICAgIHJldHVybiBsYXN0VGltZTtcbiAgfSxcblxuICAvKiBET00gQ1JFQVRJT04gJiBJTlRFUkFDVElPTiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuICAvKipcbiAgICogQ3JlYXRlIGFsbCBvZiB0aGUgRE9NIGZvciB0aGUgY29udHJvbC5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9jcmVhdGVET00oKSB7XG4gICAgY29uc3QgY2xhc3NlcyA9IFtcbiAgICAgICdsZWFmbGV0LWNvbnRyb2wtbGF5ZXJzJyxcbiAgICAgICdsZWFmbGV0LWNvbnRyb2wtbGF5ZXJzLWV4cGFuZGVkJyxcbiAgICAgICdsZWFmbGV0LXRpbWVsaW5lLWNvbnRyb2wnLFxuICAgIF07XG4gICAgY29uc3QgY29udGFpbmVyID0gTC5Eb21VdGlsLmNyZWF0ZSgnZGl2JywgY2xhc3Nlcy5qb2luKCcgJykpO1xuICAgIHRoaXMuY29udGFpbmVyID0gY29udGFpbmVyO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuZW5hYmxlUGxheWJhY2spIHtcbiAgICAgIGNvbnN0IHNsaWRlckN0cmxDID0gTC5Eb21VdGlsLmNyZWF0ZShcbiAgICAgICAgJ2RpdicsXG4gICAgICAgICdzbGRyLWN0cmwtY29udGFpbmVyJyxcbiAgICAgICAgY29udGFpbmVyXG4gICAgICApO1xuICAgICAgY29uc3QgYnV0dG9uQ29udGFpbmVyID0gTC5Eb21VdGlsLmNyZWF0ZShcbiAgICAgICAgJ2RpdicsXG4gICAgICAgICdidXR0b24tY29udGFpbmVyJyxcbiAgICAgICAgc2xpZGVyQ3RybENcbiAgICAgICk7XG4gICAgICB0aGlzLl9tYWtlQnV0dG9ucyhidXR0b25Db250YWluZXIpO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5lbmFibGVLZXlib2FyZENvbnRyb2xzKSB7XG4gICAgICAgIHRoaXMuX2FkZEtleUxpc3RlbmVycygpO1xuICAgICAgfVxuICAgICAgdGhpcy5fbWFrZU91dHB1dChzbGlkZXJDdHJsQyk7XG4gICAgfVxuICAgIHRoaXMuX21ha2VTbGlkZXIoY29udGFpbmVyKTtcbiAgICBpZiAodGhpcy5vcHRpb25zLnNob3dUaWNrcykge1xuICAgICAgdGhpcy5fYnVpbGREYXRhTGlzdChjb250YWluZXIpO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogQWRkIGtleWJvYXJkIGxpc3RlbmVycyBmb3Iga2V5Ym9hcmQgY29udHJvbFxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2FkZEtleUxpc3RlbmVycygpIHtcbiAgICB0aGlzLl9saXN0ZW5lciA9ICguLi5hcmdzKSA9PiB0aGlzLl9vbktleWRvd24oLi4uYXJncyk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX2xpc3RlbmVyKTtcbiAgfSxcblxuICAvKipcbiAgICogUmVtb3ZlIGtleWJvYXJkIGxpc3RlbmVyc1xuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3JlbW92ZUtleUxpc3RlbmVycygpIHtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5fbGlzdGVuZXIpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RzIGEgPGRhdGFsaXN0PiwgZm9yIHNob3dpbmcgdGlja3Mgb24gdGhlIHJhbmdlIGlucHV0LlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBjb250YWluZXIgVGhlIGNvbnRhaW5lciB0byB3aGljaCB0byBhZGQgdGhlIGRhdGFsaXN0XG4gICAqL1xuICBfYnVpbGREYXRhTGlzdChjb250YWluZXIpIHtcbiAgICB0aGlzLl9kYXRhbGlzdCA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RhdGFsaXN0JywgJycsIGNvbnRhaW5lcik7XG4gICAgY29uc3QgaWROdW0gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMDAwMDAwKTtcbiAgICB0aGlzLl9kYXRhbGlzdC5pZCA9IGB0aW1lbGluZS1kYXRhbGlzdC0ke2lkTnVtfWA7XG4gICAgdGhpcy5fdGltZVNsaWRlci5zZXRBdHRyaWJ1dGUoJ2xpc3QnLCB0aGlzLl9kYXRhbGlzdC5pZCk7XG4gICAgdGhpcy5fcmVidWlsZERhdGFMaXN0KCk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJlY29uc3RydWN0cyB0aGUgPGRhdGFsaXN0Pi4gU2hvdWxkIGJlIGNhbGxlZCB3aGVuIG5ldyBkYXRhIGNvbWVzIGluLlxuICAgKi9cbiAgX3JlYnVpbGREYXRhTGlzdCgpIHtcbiAgICBjb25zdCBkYXRhbGlzdCA9IHRoaXMuX2RhdGFsaXN0O1xuICAgIHdoaWxlIChkYXRhbGlzdC5maXJzdENoaWxkKSB7XG4gICAgICBkYXRhbGlzdC5yZW1vdmVDaGlsZChkYXRhbGlzdC5maXJzdENoaWxkKTtcbiAgICB9XG4gICAgY29uc3QgZGF0YWxpc3RTZWxlY3QgPSBMLkRvbVV0aWwuY3JlYXRlKCdzZWxlY3QnLCAnJywgdGhpcy5fZGF0YWxpc3QpO1xuICAgIHRoaXMuX2dldFRpbWVzKCkuZm9yRWFjaCgodGltZSkgPT4ge1xuICAgICAgTC5Eb21VdGlsLmNyZWF0ZSgnb3B0aW9uJywgJycsIGRhdGFsaXN0U2VsZWN0KS52YWx1ZSA9IHRpbWU7XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIE1ha2VzIGEgYnV0dG9uIHdpdGggdGhlIHBhc3NlZCBuYW1lIGFzIGEgY2xhc3MsIHdoaWNoIGNhbGxzIHRoZVxuICAgKiBjb3JyZXNwb25kaW5nIGZ1bmN0aW9uIHdoZW4gY2xpY2tlZC4gQXR0YWNoZXMgdGhlIGJ1dHRvbiB0byBjb250YWluZXIuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGNvbnRhaW5lciBUaGUgY29udGFpbmVyIHRvIHdoaWNoIHRvIGFkZCB0aGUgYnV0dG9uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFRoZSBjbGFzcyB0byBnaXZlIHRoZSBidXR0b24gYW5kIHRoZSBmdW5jdGlvbiB0byBjYWxsXG4gICAqL1xuICBfbWFrZUJ1dHRvbihjb250YWluZXIsIG5hbWUpIHtcbiAgICBjb25zdCBidXR0b24gPSBMLkRvbVV0aWwuY3JlYXRlKCdidXR0b24nLCBuYW1lLCBjb250YWluZXIpO1xuICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXNbbmFtZV0oKSk7XG4gICAgTC5Eb21FdmVudC5kaXNhYmxlQ2xpY2tQcm9wYWdhdGlvbihidXR0b24pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBNYWtlcyB0aGUgcHJldiwgcGxheSwgcGF1c2UsIGFuZCBuZXh0IGJ1dHRvbnNcbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtIVE1MRWxlbWVudH0gY29udGFpbmVyIFRoZSBjb250YWluZXIgdG8gd2hpY2ggdG8gYWRkIHRoZSBidXR0b25zXG4gICAqL1xuICBfbWFrZUJ1dHRvbnMoY29udGFpbmVyKSB7XG4gICAgdGhpcy5fbWFrZUJ1dHRvbihjb250YWluZXIsICdwcmV2Jyk7XG4gICAgdGhpcy5fbWFrZUJ1dHRvbihjb250YWluZXIsICdwbGF5Jyk7XG4gICAgdGhpcy5fbWFrZUJ1dHRvbihjb250YWluZXIsICdwYXVzZScpO1xuICAgIHRoaXMuX21ha2VCdXR0b24oY29udGFpbmVyLCAnbmV4dCcpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIHRoZSByYW5nZSBpbnB1dFxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBjb250YWluZXIgVGhlIGNvbnRhaW5lciB0byB3aGljaCB0byBhZGQgdGhlIGlucHV0XG4gICAqL1xuICBfbWFrZVNsaWRlcihjb250YWluZXIpIHtcbiAgICBjb25zdCBzbGlkZXIgPSBMLkRvbVV0aWwuY3JlYXRlKCdpbnB1dCcsICd0aW1lLXNsaWRlcicsIGNvbnRhaW5lcik7XG4gICAgc2xpZGVyLnR5cGUgPSAncmFuZ2UnO1xuICAgIHNsaWRlci5taW4gPSB0aGlzLnN0YXJ0IHx8IDA7XG4gICAgc2xpZGVyLm1heCA9IHRoaXMuZW5kIHx8IDA7XG4gICAgc2xpZGVyLnZhbHVlID0gdGhpcy5zdGFydCB8fCAwO1xuICAgIHNsaWRlci5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZSkgPT4gdGhpcy5fc2xpZGVyQ2hhbmdlZChlKSk7XG4gICAgc2xpZGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgKGUpID0+IHRoaXMuX3NsaWRlckNoYW5nZWQoZSkpO1xuICAgIHNsaWRlci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoKSA9PiB0aGlzLm1hcC5kcmFnZ2luZy5kaXNhYmxlKCkpO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCAoKSA9PiB0aGlzLm1hcC5kcmFnZ2luZy5lbmFibGUoKSk7XG4gICAgdGhpcy5fdGltZVNsaWRlciA9IHNsaWRlcjtcbiAgfSxcblxuICBfbWFrZU91dHB1dChjb250YWluZXIpIHtcbiAgICB0aGlzLl9vdXRwdXQgPSBMLkRvbVV0aWwuY3JlYXRlKCdvdXRwdXQnLCAndGltZS10ZXh0JywgY29udGFpbmVyKTtcbiAgICB0aGlzLl9vdXRwdXQuaW5uZXJIVE1MID0gdGhpcy5vcHRpb25zLmZvcm1hdE91dHB1dCh0aGlzLnN0YXJ0KTtcbiAgfSxcblxuICBfb25LZXlkb3duKGUpIHtcbiAgICBzd2l0Y2ggKGUua2V5Q29kZSB8fCBlLndoaWNoKSB7XG4gICAgICBjYXNlIDM3OiB0aGlzLnByZXYoKTsgYnJlYWs7XG4gICAgICBjYXNlIDM5OiB0aGlzLm5leHQoKTsgYnJlYWs7XG4gICAgICBjYXNlIDMyOiB0aGlzLnRvZ2dsZSgpOyBicmVhaztcbiAgICAgIGRlZmF1bHQ6IHJldHVybjtcbiAgICB9XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICB9LFxuXG4gIF9zbGlkZXJDaGFuZ2VkKGUpIHtcbiAgICBjb25zdCB0aW1lID0gcGFyc2VGbG9hdChlLnRhcmdldC52YWx1ZSwgMTApO1xuICAgIHRoaXMudGltZSA9IHRpbWU7XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMud2FpdFRvVXBkYXRlTWFwIHx8IGUudHlwZSA9PT0gJ2NoYW5nZScpIHtcbiAgICAgIHRoaXMudGltZWxpbmVzLmZvckVhY2goKHRpbWVsaW5lKSA9PiB0aW1lbGluZS5zZXRUaW1lKHRpbWUpKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX291dHB1dCkge1xuICAgICAgdGhpcy5fb3V0cHV0LmlubmVySFRNTCA9IHRoaXMub3B0aW9ucy5mb3JtYXRPdXRwdXQodGltZSk7XG4gICAgfVxuICB9LFxuXG4gIC8qIEVYVEVSTkFMIEFQSSAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gIC8qKlxuICAgKiBSZWdpc3RlciB0aW1lbGluZSBsYXllcnMgd2l0aCB0aGlzIGNvbnRyb2wuIFRoaXMgY291bGQgY2hhbmdlIHRoZSBzdGFydCBhbmRcbiAgICogZW5kIHBvaW50cyBvZiB0aGUgdGltZWxpbmUgKHVubGVzcyBtYW51YWxseSBzZXQpLiBJdCB3aWxsIGFsc28gcmVzZXQgdGhlXG4gICAqIHBsYXliYWNrLlxuICAgKlxuICAgKiBAcGFyYW0gey4uLkwuVGltZWxpbmV9IHRpbWVsaW5lcyBUaGUgYEwuVGltZWxpbmVgcyB0byByZWdpc3RlclxuICAgKi9cbiAgYWRkVGltZWxpbmVzKC4uLnRpbWVsaW5lcykge1xuICAgIHRoaXMucGF1c2UoKTtcbiAgICBjb25zdCB0aW1lbGluZUNvdW50ID0gdGhpcy50aW1lbGluZXMubGVuZ3RoO1xuICAgIHRpbWVsaW5lcy5mb3JFYWNoKCh0aW1lbGluZSkgPT4ge1xuICAgICAgaWYgKHRoaXMudGltZWxpbmVzLmluZGV4T2YodGltZWxpbmUpID09PSAtMSkge1xuICAgICAgICB0aGlzLnRpbWVsaW5lcy5wdXNoKHRpbWVsaW5lKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAodGhpcy50aW1lbGluZXMubGVuZ3RoICE9PSB0aW1lbGluZUNvdW50KSB7XG4gICAgICB0aGlzLl9yZWNhbGN1bGF0ZSgpO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5zaG93VGlja3MpIHtcbiAgICAgICAgdGhpcy5fcmVidWlsZERhdGFMaXN0KCk7XG4gICAgICB9XG4gICAgICB0aGlzLnNldFRpbWUodGhpcy5zdGFydCk7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBVbnJlZ2lzdGVyIHRpbWVsaW5lIGxheWVycyB3aXRoIHRoaXMgY29udHJvbC4gVGhpcyBjb3VsZCBjaGFuZ2UgdGhlIHN0YXJ0XG4gICAqIGFuZCBlbmQgcG9pbnRzIG9mIHRoZSB0aW1lbGluZSB1bmxlc3MgbWFudWFsbHkgc2V0LiBJdCB3aWxsIGFsc28gcmVzZXQgdGhlXG4gICAqIHBsYXliYWNrLlxuICAgKlxuICAgKiBAcGFyYW0gey4uLkwuVGltZWxpbmV9IHRpbWVsaW5lcyBUaGUgYEwuVGltZWxpbmVgcyB0byB1bnJlZ2lzdGVyXG4gICAqL1xuICByZW1vdmVUaW1lbGluZXMoLi4udGltZWxpbmVzKSB7XG4gICAgdGhpcy5wYXVzZSgpO1xuICAgIGNvbnN0IHRpbWVsaW5lQ291bnQgPSB0aGlzLnRpbWVsaW5lcy5sZW5ndGg7XG4gICAgdGltZWxpbmVzLmZvckVhY2goKHRpbWVsaW5lKSA9PiB7XG4gICAgICBjb25zdCBpbmRleCA9IHRoaXMudGltZWxpbmVzLmluZGV4T2YodGltZWxpbmUpO1xuICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICB0aGlzLnRpbWVsaW5lcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmICh0aGlzLnRpbWVsaW5lcy5sZW5ndGggIT09IHRpbWVsaW5lQ291bnQpIHtcbiAgICAgIHRoaXMuX3JlY2FsY3VsYXRlKCk7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLnNob3dUaWNrcykge1xuICAgICAgICB0aGlzLl9yZWJ1aWxkRGF0YUxpc3QoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2V0VGltZSh0aGlzLnN0YXJ0KTtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIFRvZ2dsZXMgcGxheS9wYXVzZSBzdGF0ZS5cbiAgICovXG4gIHRvZ2dsZSgpIHtcbiAgICBpZiAodGhpcy5fcGxheWluZykge1xuICAgICAgdGhpcy5wYXVzZSgpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMucGxheSgpO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogUGF1c2VzIHBsYXliYWNrIGFuZCBnb2VzIHRvIHRoZSBwcmV2aW91cyBldmVudC5cbiAgICovXG4gIHByZXYoKSB7XG4gICAgdGhpcy5wYXVzZSgpO1xuICAgIGNvbnN0IHByZXZUaW1lID0gdGhpcy5fbmVhcmVzdEV2ZW50VGltZSh0aGlzLnRpbWUsIC0xKTtcbiAgICB0aGlzLl90aW1lU2xpZGVyLnZhbHVlID0gcHJldlRpbWU7XG4gICAgdGhpcy5zZXRUaW1lKHByZXZUaW1lKTtcbiAgfSxcblxuICAvKipcbiAgICogUGF1c2VzIHBsYXliYWNrLlxuICAgKi9cbiAgcGF1c2UoKSB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuX3RpbWVyKTtcbiAgICB0aGlzLl9wbGF5aW5nID0gZmFsc2U7XG4gICAgdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LnJlbW92ZSgncGxheWluZycpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBTdGFydHMgcGxheWJhY2suXG4gICAqL1xuICBwbGF5KCkge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLl90aW1lcik7XG4gICAgaWYgKHBhcnNlRmxvYXQodGhpcy5fdGltZVNsaWRlci52YWx1ZSwgMTApID09PSB0aGlzLmVuZCkge1xuICAgICAgdGhpcy5fdGltZVNsaWRlci52YWx1ZSA9IHRoaXMuc3RhcnQ7XG4gICAgfVxuICAgIHRoaXMuX3RpbWVTbGlkZXIudmFsdWUgPSBwYXJzZUZsb2F0KHRoaXMuX3RpbWVTbGlkZXIudmFsdWUsIDEwKVxuICAgICAgKyB0aGlzLl9zdGVwU2l6ZTtcbiAgICB0aGlzLnNldFRpbWUodGhpcy5fdGltZVNsaWRlci52YWx1ZSk7XG4gICAgaWYgKHBhcnNlRmxvYXQodGhpcy5fdGltZVNsaWRlci52YWx1ZSwgMTApID09PSB0aGlzLmVuZCkge1xuICAgICAgdGhpcy5fcGxheWluZyA9IGZhbHNlO1xuICAgICAgdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LnJlbW92ZSgncGxheWluZycpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMuX3BsYXlpbmcgPSB0cnVlO1xuICAgICAgdGhpcy5jb250YWluZXIuY2xhc3NMaXN0LmFkZCgncGxheWluZycpO1xuICAgICAgdGhpcy5fdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMucGxheSgpLCB0aGlzLl9zdGVwRHVyYXRpb24pO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogUGF1c2VzIHBsYXliYWNrIGFuZCBnb2VzIHRvIHRoZSBuZXh0IGV2ZW50LlxuICAgKi9cbiAgbmV4dCgpIHtcbiAgICB0aGlzLnBhdXNlKCk7XG4gICAgY29uc3QgbmV4dFRpbWUgPSB0aGlzLl9uZWFyZXN0RXZlbnRUaW1lKHRoaXMudGltZSwgMSk7XG4gICAgdGhpcy5fdGltZVNsaWRlci52YWx1ZSA9IG5leHRUaW1lO1xuICAgIHRoaXMuc2V0VGltZShuZXh0VGltZSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFNldCB0aGUgdGltZSBkaXNwbGF5ZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB0aW1lIFRoZSB0aW1lIHRvIHNldFxuICAgKi9cbiAgc2V0VGltZSh0aW1lKSB7XG4gICAgdGhpcy5fc2xpZGVyQ2hhbmdlZCh7XG4gICAgICB0eXBlOiAnY2hhbmdlJyxcbiAgICAgIHRhcmdldDoge3ZhbHVlOiB0aW1lfSxcbiAgICB9KTtcbiAgfSxcblxuICBvbkFkZChtYXApIHtcbiAgICB0aGlzLm1hcCA9IG1hcDtcbiAgICB0aGlzLl9jcmVhdGVET00oKTtcbiAgICB0aGlzLnNldFRpbWUodGhpcy5zdGFydCk7XG4gICAgcmV0dXJuIHRoaXMuY29udGFpbmVyO1xuICB9LFxuXG4gIG9uUmVtb3ZlKCkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMuZW5hYmxlS2V5Ym9hcmRDb250cm9scykge1xuICAgICAgdGhpcy5fcmVtb3ZlS2V5TGlzdGVuZXJzKCk7XG4gICAgfVxuICB9LFxufSk7XG5cbkwudGltZWxpbmVTbGlkZXJDb250cm9sID0gKHRpbWVsaW5lLCBzdGFydCwgZW5kLCB0aW1lbGlzdCkgPT5cbiAgbmV3IEwuVGltZWxpbmVTbGlkZXJDb250cm9sKHRpbWVsaW5lLCBzdGFydCwgZW5kLCB0aW1lbGlzdCk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9UaW1lbGluZVNsaWRlckNvbnRyb2wuanNcbiAqKi8iLCIvLyByZW1vdmVkIGJ5IGV4dHJhY3QtdGV4dC13ZWJwYWNrLXBsdWdpblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvbGVhZmxldC50aW1lbGluZS5zYXNzXG4gKiogbW9kdWxlIGlkID0gNFxuICoqIG1vZHVsZSBjaHVua3MgPSAwIDFcbiAqKi8iXSwic291cmNlUm9vdCI6IiJ9