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
  initialize(options = {}) {
    const defaultOptions = {
      duration:               10000,
      enableKeyboardControls: false,
      enablePlayback:         true,
      formatOutput:           (output) => `${output || ''}`,
      showTicks:              true,
      waitToUpdateMap:        false,
      position:               'bottomleft',
      steps:                  1000,
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
  _getTimes() {
    const times = [];
    this.timelines.forEach((timeline) => {
      const timesInRange = timeline.times
        .filter((time) => time >= this.start && time <= this.end);
      times.push(...timesInRange);
    });
    if (times.length) {
      times.sort((a, b) => a - b);
      const dedupedTimes = [times[0]];
      times.reduce((a, b) => {
        if (a !== b) {
          dedupedTimes.push(b);
        }
        return b;
      });
      return dedupedTimes;
    }
    return times;
  },

  /**
   * Adjusts start/end/step size/etc. Should be called if any of those might
   * change (e.g. when adding a new layer).
   *
   * @private
   */
  _recalculate() {
    const manualStart = typeof this.options.start !== 'undefined';
    const manualEnd = typeof this.options.end !== 'undefined';
    const duration = this.options.duration;
    let min = Infinity;
    let max = -Infinity;
    this.timelines.forEach((timeline) => {
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
  _nearestEventTime(findTime, mode = 0) {
    const times = this._getTimes();
    let retNext = false;
    let lastTime = times[0];
    for (let i = 1; i < times.length; i++) {
      const time = times[i];
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

  /* DOM CREATION & INTERACTION ***********************************************/

  /**
   * Create all of the DOM for the control.
   *
   * @private
   */
  _createDOM() {
    const classes = [
      'leaflet-control-layers',
      'leaflet-control-layers-expanded',
      'leaflet-timeline-control',
    ];
    const container = L.DomUtil.create('div', classes.join(' '));
    this.container = container;
    if (this.options.enablePlayback) {
      const sliderCtrlC = L.DomUtil.create(
        'div',
        'sldr-ctrl-container',
        container
      );
      const buttonContainer = L.DomUtil.create(
        'div',
        'button-container',
        sliderCtrlC
      );
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
  _addKeyListeners() {
    this._listener = (...args) => this._onKeydown(...args);
    document.addEventListener('keydown', this._listener);
  },

  /**
   * Remove keyboard listeners
   *
   * @private
   */
  _removeKeyListeners() {
    document.removeEventListener('keydown', this._listener);
  },

  /**
   * Constructs a <datalist>, for showing ticks on the range input.
   *
   * @private
   * @param {HTMLElement} container The container to which to add the datalist
   */
  _buildDataList(container) {
    this._datalist = L.DomUtil.create('datalist', '', container);
    const idNum = Math.floor(Math.random() * 1000000);
    this._datalist.id = `timeline-datalist-${idNum}`;
    this._timeSlider.setAttribute('list', this._datalist.id);
    this._rebuildDataList();
  },

  /**
   * Reconstructs the <datalist>. Should be called when new data comes in.
   */
  _rebuildDataList() {
    const datalist = this._datalist;
    while (datalist.firstChild) {
      datalist.removeChild(datalist.firstChild);
    }
    const datalistSelect = L.DomUtil.create('select', '', this._datalist);
    this._getTimes().forEach((time) => {
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
  _makeButton(container, name) {
    const button = L.DomUtil.create('button', name, container);
    button.addEventListener('click', () => this[name]());
    L.DomEvent.disableClickPropagation(button);
  },

  /**
   * Makes the prev, play, pause, and next buttons
   *
   * @private
   * @param {HTMLElement} container The container to which to add the buttons
   */
  _makeButtons(container) {
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
  _makeSlider(container) {
    const slider = L.DomUtil.create('input', 'time-slider', container);
    slider.type = 'range';
    slider.min = this.start || 0;
    slider.max = this.end || 0;
    slider.value = this.start || 0;
    slider.addEventListener('change', (e) => this._sliderChanged(e));
    slider.addEventListener('input', (e) => this._sliderChanged(e));
    slider.addEventListener('mousedown', () => this.map.dragging.disable());
    document.addEventListener('mouseup', () => this.map.dragging.enable());
    this._timeSlider = slider;
  },

  _makeOutput(container) {
    this._output = L.DomUtil.create('output', 'time-text', container);
    this._output.innerHTML = this.options.formatOutput(this.start);
  },

  _onKeydown(e) {
    switch (e.keyCode || e.which) {
      case 37: this.prev(); break;
      case 39: this.next(); break;
      case 32: this.toggle(); break;
      default: return;
    }
    e.preventDefault();
  },

  _sliderChanged(e) {
    const time = parseFloat(e.target.value, 10);
    this.time = time;
    if (!this.options.waitToUpdateMap || e.type === 'change') {
      this.timelines.forEach((timeline) => timeline.setTime(time));
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
  addTimelines(...timelines) {
    this.pause();
    const timelineCount = this.timelines.length;
    timelines.forEach((timeline) => {
      if (this.timelines.indexOf(timeline) === -1) {
        this.timelines.push(timeline);
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
  removeTimelines(...timelines) {
    this.pause();
    const timelineCount = this.timelines.length;
    timelines.forEach((timeline) => {
      const index = this.timelines.indexOf(timeline);
      if (index !== -1) {
        this.timelines.splice(index, 1);
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
  toggle() {
    if (this._playing) {
      this.pause();
    }
    else {
      this.play();
    }
  },

  /**
   * Pauses playback and goes to the previous event.
   */
  prev() {
    this.pause();
    const prevTime = this._nearestEventTime(this.time, -1);
    this._timeSlider.value = prevTime;
    this.setTime(prevTime);
  },

  /**
   * Pauses playback.
   */
  pause() {
    clearTimeout(this._timer);
    this._playing = false;
    this.container.classList.remove('playing');
  },

  /**
   * Starts playback.
   */
  play() {
    clearTimeout(this._timer);
    if (parseFloat(this._timeSlider.value, 10) === this.end) {
      this._timeSlider.value = this.start;
    }
    this._timeSlider.value = parseFloat(this._timeSlider.value, 10)
      + this._stepSize;
    this.setTime(this._timeSlider.value);
    if (parseFloat(this._timeSlider.value, 10) === this.end) {
      this._playing = false;
      this.container.classList.remove('playing');
    }
    else {
      this._playing = true;
      this.container.classList.add('playing');
      this._timer = setTimeout(() => this.play(), this._stepDuration);
    }
  },

  /**
   * Pauses playback and goes to the next event.
   */
  next() {
    this.pause();
    const nextTime = this._nearestEventTime(this.time, 1);
    this._timeSlider.value = nextTime;
    this.setTime(nextTime);
  },

  /**
   * Set the time displayed.
   *
   * @param {Number} time The time to set
   */
  setTime(time) {
    this._sliderChanged({
      type: 'change',
      target: {value: time},
    });
  },

  onAdd(map) {
    this.map = map;
    this._createDOM();
    this.setTime(this.start);
    return this.container;
  },

  onRemove() {
    if (this.options.enableKeyboardControls) {
      this._removeKeyListeners();
    }
  },
});

L.timelineSliderControl = (timeline, start, end, timelist) =>
  new L.TimelineSliderControl(timeline, start, end, timelist);
