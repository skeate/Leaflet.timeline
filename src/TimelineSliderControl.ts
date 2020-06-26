/** @ignore */
import L = require("leaflet");

interface TimelineSliderControlOptions extends L.ControlOptions {
  /**
   * Minimum time, in ms, for the playback to take. Will almost certainly
   * actually take at least a bit longer; after each frame, the next one
   * displays in `duration/steps` ms, so each frame really takes frame
   * processing time PLUS step time.
   *
   * Default: 10000
   */
  duration?: number;
  /**
   * Allow playback to be controlled using the spacebar (play/pause) and
   * right/left arrow keys (next/previous).
   *
   * Default: false
   */
  enableKeyboardControls?: boolean;
  /**
   * Show playback controls (i.e.  prev/play/pause/next).
   *
   * Default: true
   */
  enablePlayback?: boolean;
  /**
   * Show ticks on the timeline (if the browser supports it)
   *
   * See here for support:
   * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range#Browser_compatibility
   *
   * Default: true
   */
  showTicks?: boolean;
  /**
   * Wait until the user is finished changing the date to update the map. By
   * default, both the map and the date update for every change. With complex
   * data, this can slow things down, so set this to true to only update the
   * displayed date.
   */
  waitToUpdateMap?: boolean;
  /**
   * The start time of the timeline. If unset, this will be calculated
   * automatically based on the timelines registered to this control.
   */
  start?: number;
  /**
   * The end time of the timeline. If unset, this will be calculated
   * automatically based on the timelines registered to this control.
   */
  end?: number;
  /**
   * How many steps to break the timeline into. Each step will then be
   * `(end-start) / steps`. Only affects playback.
   *
   * Default: 1000
   */
  steps?: number;
  /**
   * Start playback of the timeline as soon as the page is loaded.
   *
   * Default: false
   */
  autoPlay?: boolean;

  /**
   * A function which takes the current time value (a Unix timestamp) and
   * outputs a string that is displayed beneath the control buttons.
   */
  formatOutput?(time: number): string;
}

/** @ignore */
type PlaybackControl = "play" | "pause" | "prev" | "next";

/** @ignore */
type TSC = L.TimelineSliderControl;

declare module "leaflet" {
  export class TimelineSliderControl extends L.Control {
    container: HTMLElement;
    options: Required<TimelineSliderControlOptions>;
    timelines: L.Timeline[];
    start: number;
    end: number;
    map: L.Map;
    time: number;
    syncedControl: TSC[];

    /** @ignore */
    _datalist?: HTMLDataListElement;
    /** @ignore */
    _output?: HTMLOutputElement;
    /** @ignore */
    _stepDuration: number;
    /** @ignore */
    _stepSize: number;
    /** @ignore */
    _timeSlider: HTMLInputElement;
    /** @ignore */
    _playing: boolean;
    /** @ignore */
    _timer: number;
    /** @ignore */
    _listener: (ev: KeyboardEvent) => any;

    /** @ignore */
    initialize(this: TSC, options: TimelineSliderControlOptions): void;
    /** @ignore */
    _getTimes(this: TSC): number[];
    /** @ignore */
    _nearestEventTime(this: TSC, findTime: number, mode?: 1 | -1): number;
    /** @ignore */
    _recalculate(this: TSC): void;
    /** @ignore */
    _createDOM(this: TSC): void;
    /** @ignore */
    _addKeyListeners(this: TSC): void;
    /** @ignore */
    _removeKeyListeners(this: TSC): void;
    /** @ignore */
    _buildDataList(this: TSC, container: HTMLElement): void;
    /** @ignore */
    _rebuildDataList(this: TSC): void;
    /** @ignore */
    _makeButton(this: TSC, container: HTMLElement, name: PlaybackControl): void;
    /** @ignore */
    _makeButtons(this: TSC, container: HTMLElement): void;
    /** @ignore */
    _makeOutput(this: TSC, container: HTMLElement): void;
    /** @ignore */
    _makeSlider(this: TSC, container: HTMLElement): void;
    /** @ignore */
    _onKeydown(this: TSC, ev: KeyboardEvent): void;
    /** @ignore */
    _sliderChanged(this: TSC, e: Event): void;
    /** @ignore */
    _setTime(this: TSC, time: number, type: string): void;
    /** @ignore */
    _disableMapDragging(this: TSC): void;
    /** @ignore */
    _enableMapDragging(this: TSC): void;
    /** @ignore */
    _resetIfTimelinesChanged(this: TSC, oldTimelineCount: number): void;
    /** @ignore */
    _autoPlay(this: TSC): void;

    play(this: TSC, fromSynced?: boolean): void;
    pause(this: TSC, fromSynced?: boolean): void;
    prev(this: TSC): void;
    next(this: TSC): void;
    toggle(this: TSC): void;
    setTime(this: TSC, time: number): void;
    addTimelines(this: TSC, ...timelines: L.Timeline[]): void;
    removeTimelines(this: TSC, ...timelines: L.Timeline[]): void;
    syncControl(this: TSC, controlToSync: TSC): void;
  }

  let timelineSliderControl: (options?: TimelineSliderControlOptions) => TSC;
}

// @ts-ignore
L.TimelineSliderControl = L.Control.extend({
  initialize(options = {}) {
    const defaultOptions: TimelineSliderControlOptions = {
      duration: 10000,
      enableKeyboardControls: false,
      enablePlayback: true,
      formatOutput: (output) => `${output || ""}`,
      showTicks: true,
      waitToUpdateMap: false,
      position: "bottomleft",
      steps: 1000,
      autoPlay: false,
    };
    this.timelines = [];
    L.Util.setOptions(this, defaultOptions);
    L.Util.setOptions(this, options);
    this.start = options.start || 0;
    this.end = options.end || 0;
  },

  /* INTERNAL API *************************************************************/

  /**
   * @private
   * @returns A flat, sorted list of all the times of all layers
   */
  _getTimes() {
    const times: number[] = [];
    this.timelines.forEach((timeline) => {
      const timesInRange = timeline.times.filter(
        (time) => time >= this.start && time <= this.end
      );
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
   * Adjusts start/end/step size. Should be called if any of those might
   * change (e.g. when adding a new layer).
   *
   * @private
   */
  _recalculate() {
    const manualStart = typeof this.options.start !== "undefined";
    const manualEnd = typeof this.options.end !== "undefined";
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
      this._timeSlider.min = (min === Infinity ? 0 : min).toString();
      this._timeSlider.value = this._timeSlider.min;
    }
    if (!manualEnd) {
      this.end = max;
      this._timeSlider.max = (max === -Infinity ? 0 : max).toString();
    }
    this._stepSize = Math.max(1, (this.end - this.start) / this.options.steps);
    this._stepDuration = Math.max(1, duration / this.options.steps);
  },

  /**
   * @private
   * @param findTime The time to find events around
   * @param mode The operating mode.
   * If `mode` is 1, finds the event immediately after `findTime`.
   * If `mode` is -1, finds the event immediately before `findTime`.
   * @returns The time of the nearest event.
   */
  _nearestEventTime(findTime, mode = 1) {
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
        if (time === findTime) {
          retNext = true;
        } else {
          return time;
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
      "leaflet-control-layers",
      "leaflet-control-layers-expanded",
      "leaflet-timeline-control",
    ];
    const container = L.DomUtil.create("div", classes.join(" "));
    this.container = container;
    if (this.options.enablePlayback) {
      const sliderCtrlC = L.DomUtil.create(
        "div",
        "sldr-ctrl-container",
        container
      );
      const buttonContainer = L.DomUtil.create(
        "div",
        "button-container",
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
    if (this.options.autoPlay) {
      this._autoPlay();
    }
  },

  /**
   * Add keyboard listeners for keyboard control
   *
   * @private
   */
  _addKeyListeners(): void {
    this._listener = (ev: KeyboardEvent) => this._onKeydown(ev);
    document.addEventListener("keydown", this._listener);
  },

  /**
   * Remove keyboard listeners
   *
   * @private
   */
  _removeKeyListeners(): void {
    document.removeEventListener("keydown", this._listener);
  },

  /**
   * Constructs a <datalist>, for showing ticks on the range input.
   *
   * @private
   * @param container The container to which to add the datalist
   */
  _buildDataList(container): void {
    this._datalist = L.DomUtil.create(
      "datalist",
      "",
      container
    ) as HTMLDataListElement;
    const idNum = Math.floor(Math.random() * 1000000);
    this._datalist.id = `timeline-datalist-${idNum}`;
    this._timeSlider.setAttribute("list", this._datalist.id);
    this._rebuildDataList();
  },

  /**
   * Reconstructs the <datalist>. Should be called when new data comes in.
   */
  _rebuildDataList(): void {
    const datalist = this._datalist;
    if (!datalist) return;
    while (datalist.firstChild) {
      datalist.removeChild(datalist.firstChild);
    }
    const datalistSelect = L.DomUtil.create("select", "", this._datalist);
    datalistSelect.setAttribute("aria-label", "List of times");
    this._getTimes().forEach((time) => {
      (L.DomUtil.create(
        "option",
        "",
        datalistSelect
      ) as HTMLOptionElement).value = time.toString();
    });
  },

  /**
   * Makes a button with the passed name as a class, which calls the
   * corresponding function when clicked. Attaches the button to container.
   *
   * @private
   * @param container The container to which to add the button
   * @param name The class to give the button and the function to call
   */
  _makeButton(container, name) {
    const button = L.DomUtil.create("button", name, container);
    button.setAttribute("aria-label", name);
    button.addEventListener("click", () => this[name]());
    L.DomEvent.disableClickPropagation(button);
  },

  /**
   * Makes the prev, play, pause, and next buttons
   *
   * @private
   * @param container The container to which to add the buttons
   */
  _makeButtons(container) {
    this._makeButton(container, "prev");
    this._makeButton(container, "play");
    this._makeButton(container, "pause");
    this._makeButton(container, "next");
  },

  /**
   * DOM event handler to disable dragging on map
   *
   * @private
   */
  _disableMapDragging() {
    this.map.dragging.disable();
  },

  /**
   * DOM event handler to enable dragging on map
   *
   * @private
   */
  _enableMapDragging() {
    this.map.dragging.enable();
  },

  /**
   * Creates the range input
   *
   * @private
   * @param container The container to which to add the input
   */
  _makeSlider(container) {
    const slider = L.DomUtil.create(
      "input",
      "time-slider",
      container
    ) as HTMLInputElement;
    slider.setAttribute("aria-label", "Slider");
    slider.type = "range";
    slider.min = (this.start || 0).toString();
    slider.max = (this.end || 0).toString();
    slider.value = (this.start || 0).toString();
    this._timeSlider = slider;
    // register events using leaflet for easy removal
    L.DomEvent.on(
      this._timeSlider,
      "mousedown mouseup click touchstart",
      L.DomEvent.stopPropagation
    );
    L.DomEvent.on(this._timeSlider, "change input", this._sliderChanged, this);
    L.DomEvent.on(
      this._timeSlider,
      "mouseenter",
      this._disableMapDragging,
      this
    );
    L.DomEvent.on(
      this._timeSlider,
      "mouseleave",
      this._enableMapDragging,
      this
    );
  },

  _makeOutput(container) {
    this._output = L.DomUtil.create(
      "output",
      "time-text",
      container
    ) as HTMLOutputElement;
    this._output.innerHTML = this.options.formatOutput(this.start);
  },

  _onKeydown(e) {
    let target = (e.target || e.srcElement) as HTMLElement;
    if (!/INPUT|TEXTAREA/.test(target.tagName)) {
      switch (e.keyCode || e.which) {
        case 37:
          this.prev();
          break;
        case 39:
          this.next();
          break;
        case 32:
          this.toggle();
          break;
        default:
          return;
      }
      e.preventDefault();
    }
  },

  _sliderChanged(e) {
    const { target } = e;
    const time = parseFloat(
      target instanceof HTMLInputElement ? target.value : "0"
    );
    this._setTime(time, e.type);
  },

  _setTime(time: number, type: string) {
    this.time = time;
    if (!this.options.waitToUpdateMap || type === "change") {
      this.timelines.forEach((timeline) => timeline.setTime(time));
    }
    if (this._output) {
      this._output.innerHTML = this.options.formatOutput(time);
    }
  },

  _resetIfTimelinesChanged(oldTimelineCount) {
    if (this.timelines.length !== oldTimelineCount) {
      this._recalculate();
      if (this.options.showTicks) {
        this._rebuildDataList();
      }
      this.setTime(this.start);
    }
  },

  _autoPlay() {
    if (document.readyState === "loading") {
      window.addEventListener("load", () => this._autoPlay());
    } else {
      this.play();
    }
  },

  /* EXTERNAL API *************************************************************/

  /**
   * Register timeline layers with this control. This could change the start and
   * end points of the timeline (unless manually set). It will also reset the
   * playback.
   *
   * @param timelines The `L.Timeline`s to register
   */
  addTimelines(...timelines) {
    this.pause();
    const timelineCount = this.timelines.length;
    timelines.forEach((timeline) => {
      if (this.timelines.indexOf(timeline) === -1) {
        this.timelines.push(timeline);
      }
    });
    this._resetIfTimelinesChanged(timelineCount);
  },

  /**
   * Unregister timeline layers with this control. This could change the start
   * and end points of the timeline unless manually set. It will also reset the
   * playback.
   *
   * @param timelines The `L.Timeline`s to unregister
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
    this._resetIfTimelinesChanged(timelineCount);
  },

  /**
   * Toggles play/pause state.
   */
  toggle() {
    if (this._playing) {
      this.pause();
    } else {
      this.play();
    }
  },

  /**
   * Pauses playback and goes to the previous event.
   */
  prev() {
    this.pause();
    const prevTime = this._nearestEventTime(this.time, -1);
    this._timeSlider.value = prevTime.toString();
    this.setTime(prevTime);
  },

  /**
   * Pauses playback.
   */
  pause(fromSynced) {
    window.clearTimeout(this._timer);
    this._playing = false;
    this.container?.classList.remove("playing");

    if (this.syncedControl && !fromSynced) {
      this.syncedControl.map(function (control) {
        control.pause(true);
      });
    }
  },

  /**
   * Starts playback.
   */
  play(fromSynced) {
    window.clearTimeout(this._timer);
    if (parseFloat(this._timeSlider.value) === this.end) {
      this._timeSlider.value = this.start.toString();
    }
    this._timeSlider.value = (
      parseFloat(this._timeSlider.value) + this._stepSize
    ).toString();
    this.setTime(+this._timeSlider.value);
    if (parseFloat(this._timeSlider.value) === this.end) {
      this._playing = false;
      this.container?.classList.remove("playing");
    } else {
      this._playing = true;
      this.container?.classList.add("playing");
      this._timer = window.setTimeout(
        () => this.play(true),
        this._stepDuration
      );
    }

    if (this.syncedControl && !fromSynced) {
      this.syncedControl.map(function (control) {
        control.play(true);
      });
    }
  },

  /**
   * Pauses playback and goes to the next event.
   */
  next() {
    this.pause();
    const nextTime = this._nearestEventTime(this.time, 1);
    this._timeSlider.value = nextTime.toString();
    this.setTime(nextTime);
  },

  /**
   * Set the time displayed.
   *
   * @param time The time to set
   */
  setTime(time: number) {
    if (this._timeSlider) this._timeSlider.value = time.toString();
    this._setTime(time, "change");
  },

  onAdd(map: L.Map): HTMLElement {
    this.map = map;
    this._createDOM();
    this.setTime(this.start);
    return this.container;
  },

  onRemove() {
    /* istanbul ignore else */
    if (this.options.enableKeyboardControls) {
      this._removeKeyListeners();
    }
    // cleanup events registered in _makeSlider
    L.DomEvent.off(this._timeSlider, "change input", this._sliderChanged, this);
    L.DomEvent.off(
      this._timeSlider,
      "pointerdown mousedown touchstart",
      this._disableMapDragging,
      this
    );
    L.DomEvent.off(
      document.body,
      "pointerup mouseup touchend",
      this._enableMapDragging,
      this
    );
    // make sure that dragging is restored to enabled state
    this._enableMapDragging();
  },

  syncControl(controlToSync) {
    if (!this.syncedControl) {
      this.syncedControl = [];
    }
    this.syncedControl.push(controlToSync);
  },
});

L.timelineSliderControl = (options?: TimelineSliderControlOptions) =>
  new L.TimelineSliderControl(options);
