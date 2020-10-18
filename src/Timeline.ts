import { GenericGeoJSONFeatureCollection } from "@yaga/generic-geojson";
import { IntervalTree } from "diesal";
/** @ignore */
import L = require("leaflet");

export type TimedGeoJSON = GenericGeoJSONFeatureCollection<
  GeoJSON.Geometry,
  {
    start: string | number;
    end: string | number;
    startExclusive?: string | boolean;
    endExclusive?: string | boolean;
  }
>;

export interface TimelineOptions extends L.GeoJSONOptions {
  /**
   * If true (default), the layer will update as soon as `setTime` is called.
   *
   * If `false`, you must call `updateDisplayedLayers()` to update the display to
   * the current time. This is useful if you have complex data and performance
   * becomes a concern.
   */
  drawOnSetTime?: boolean;
  /**
   * Called for each feature, and should return either a time range for the
   * feature or `false`, indicating that it should not be included in the
   * timeline.
   *
   * If not provided, it assumes that the start/end are already part of the
   * feature object.
   */
  getInterval?(feature: GeoJSON.Feature): TimeBounds | false;

  start?: number;
  end?: number;
}

export interface TimeBounds {
  start: number;
  end: number;
  /**
   * Consider the `start` bound to exclusive, i.e., only matching `time > start` (instead of `time >= start`)
   */
  startExclusive?: boolean;
  /**
   * Consider the `end` bound to exclusive, i.e., only matching `time < end` (instead of `time <= end`)
   */
  endExclusive?: boolean;
}

declare module "leaflet" {
  export class Timeline extends L.GeoJSON {
    start: number;
    end: number;
    time: number;
    times: number[];
    ranges: IntervalTree<GeoJSON.Feature>;
    options: Required<TimelineOptions>;

    /** @ignore */
    initialize(
      geojson: TimedGeoJSON | GeoJSON.FeatureCollection,
      options?: TimelineOptions
    ): void;
    /** @ignore */
    _getInterval(feature: GeoJSON.Feature): TimeBounds | false;
    /** @ignore */
    _process(geojson: TimedGeoJSON | GeoJSON.FeatureCollection): void;
    updateDisplayedLayers(): void;
    getLayers(): L.GeoJSON[];
    setTime(time: number | string): void;
  }

  let timeline: (
    geojson?: TimedGeoJSON | GeoJSON.FeatureCollection,
    options?: TimelineOptions
  ) => L.Timeline;
}

// @ts-ignore
L.Timeline = L.GeoJSON.extend({
  times: null,
  ranges: null,

  initialize(
    this: L.Timeline,
    geojson: TimedGeoJSON | GeoJSON.FeatureCollection,
    options: TimelineOptions = {}
  ): void {
    this.times = [];
    this.ranges = new IntervalTree();
    const defaultOptions = {
      drawOnSetTime: true
    };
    // @ts-ignore
    L.GeoJSON.prototype.initialize.call(this, null, options);
    L.Util.setOptions(this, defaultOptions);
    L.Util.setOptions(this, options);
    if (this.options.getInterval) {
      this._getInterval = (feature: GeoJSON.Feature) =>
        this.options.getInterval(feature);
    }
    if (geojson) {
      this._process(geojson);
    }
  },

  _getInterval(this: L.Timeline, feature: GeoJSON.Feature): TimeBounds | false {
    if (
      feature.properties &&
      "start" in feature.properties &&
      "end" in feature.properties
    ) {
      const {startExclusive, endExclusive} = feature.properties;
      return {
        start: new Date(feature.properties.start).getTime(),
        end: new Date(feature.properties.end).getTime(),
        startExclusive: startExclusive === true || startExclusive === "true",
        endExclusive: endExclusive === true || endExclusive === "true",
      };
    }
    return false;
  },

  /**
   * Finds the first and last times in the dataset, adds all times into an
   * array, and puts everything into an IntervalTree for quick lookup.
   *
   * @param data GeoJSON to process
   */
  _process(
    this: L.Timeline,
    data: TimedGeoJSON | GeoJSON.FeatureCollection
  ): void {
    data.features.forEach(feature => {
      const interval = this._getInterval(feature);
      if (!interval) {
        return;
      }
      this.ranges.insert(
        interval.start + (interval.startExclusive ? 1 : 0),
        interval.end - (interval.endExclusive ? 1 : 0),
        feature
      );
      this.times.push(interval.start);
      this.times.push(interval.end);
    });
    if (this.times.length === 0) {
      this.start = this.options.start ?? Infinity;
      this.end = this.options.end ?? -Infinity;
      this.time = this.start;
      return;
    }
    // default sort is lexicographic, even for number types. so need to
    // specify sorting function.
    this.times.sort((a, b) => a - b);
    // de-duplicate the times
    this.times = this.times.reduce(
      (newList, x, i) => {
        if (i === 0) {
          return newList;
        }
        const lastTime = newList[newList.length - 1];
        if (lastTime !== x) {
          newList.push(x);
        }
        return newList;
      },
      [this.times[0]]
    );
    this.start = this.options.start ?? this.times[0];
    this.end = this.options.end ?? this.times[this.times.length - 1];
    this.time = this.start;
  },

  /**
   * Sets the time for this layer.
   *
   * @param time The time to set. Usually a number, but if your
   * data is really time-based then you can pass a string (e.g. '2015-01-01')
   * and it will be processed into a number automatically.
   */
  setTime(this: L.Timeline, time: number | string): void {
    this.time = typeof time === "number" ? time : new Date(time).getTime();
    if (this.options.drawOnSetTime) {
      this.updateDisplayedLayers();
    }
    this.fire("change");
  },

  /**
   * Update the layer to show only the features that are relevant at the current
   * time. Usually shouldn't need to be called manually, unless you set
   * `drawOnSetTime` to `false`.
   */
  updateDisplayedLayers(this: L.Timeline): void {
    // This loop is intended to help optimize things a bit. First, we find all
    // the features that should be displayed at the current time.
    const features = this.ranges.lookup(this.time);
    const layers = this.getLayers() as L.GeoJSON[];
    const layersToRemove: L.Layer[] = [];
    // Then we try to match each currently displayed layer up to a feature. If
    // we find a match, then we remove it from the feature list. If we don't
    // find a match, then the displayed layer is no longer valid at this time.
    // We should remove it.
    layers.forEach(layer => {
      let found = false;
      for (let j = 0; j < features.length; j++) {
        if (layer.feature === features[j]) {
          found = true;
          features.splice(j, 1);
          break;
        }
      }
      if (!found) {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => this.removeLayer(layer));
    // Finally, with any features left, they must be new data! We can add them.
    features.forEach(feature => this.addData(feature));
  }
});

L.timeline = (
  geojson?: TimedGeoJSON | GeoJSON.FeatureCollection,
  options?: TimelineOptions
) => new L.Timeline(geojson, options);
