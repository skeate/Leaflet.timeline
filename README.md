# Leaflet.timeline

Show any changing geospatial data over time, from points to polygons.

## Usage

`Leaflet.timeline` is a subclass of `L.GeoJSON`, so use it as you would that.
The data you pass in should be something like this:

``` json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "start": "1970-01-01",
        "end": new Date()
      },
      "geometry": { ... }
    }
  ]
}
```

It does add some extra options:

## Options

### [all GeoJSON's options](http://leafletjs.com/reference.html#geojson)

### `start`
*default: earliest `start` in GeoJSON*

The beginning/minimum value of the timeline.

### `end`
*default: latest `end` in GeoJSON*

The end/maximum value of the timeline.

### `position`
*default: bottomleft*

[Position](http://leafletjs.com/reference.html#control) for the timeline
controls. Probably doesn't really matter as you'll likely want to expand them
anyway.

### `formatDate`
*default: `(date) -> ""`*

A function that takes in a Unix timestamp and outputs a string. Ideally for
formatting the timestamp, but hey, you can do whatever you want.

### `enablePlayback`
*default: `true`*

Show playback controls (i.e. prev/play/pause/next).

### `steps`
*default: 1000*

How many steps to break the timeline into. Each step will then be `(end-start) /
steps`. Only affects playback.

### `duration`
*default: 10000*

Minimum time, in ms, for the playback to take. Will almost certainly actually
take at least a bit longer -- after each frame, the next one displays in
`duration/steps` ms, so each frame really takes frame processing time PLUS
step time.

### `updateMapOnDrag`
*default: true*

Two things update as you drag the slider: the time shown and the elements
displayed on the map. A very busy map might slow this down, so for better UX
disable this. The time shown will still update.

## Events

### `timeline:change`
Fired when the selected time changes (either through manually sliding or
through playback).

## Methods

### `getDisplayed`
Returns the original GeoJSON of the features that are currently being displayed
on the map.
