[![Build Status](https://travis-ci.org/skeate/Leaflet.timeline.svg)](https://travis-ci.org/skeate/Leaflet.timeline)
[![Code Climate](https://codeclimate.com/github/skeate/Leaflet.timeline/badges/gpa.svg)](https://codeclimate.com/github/skeate/Leaflet.timeline)
[![Test Coverage](https://codeclimate.com/github/skeate/Leaflet.timeline/badges/coverage.svg)](https://codeclimate.com/github/skeate/Leaflet.timeline/coverage)
[![npm version](https://img.shields.io/npm/v/leaflet.timeline.svg)](https://www.npmjs.com/package/leaflet.timeline)

[![Join the chat at https://gitter.im/skeate/Leaflet.timeline](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/skeate/Leaflet.timeline?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

# Leaflet.timeline

Show any changing geospatial data over time, from points to polygons.

If you want smooth motion of markers from point to point, this is not your
plugin. Please check out [LeafletPlayback][], or for real-time data, try
[Leaflet Realtime][], both plugins from which I may or may not have pilfered
some ideas.


## Examples

To run the examples locally, run `npm run build` and then open the one of the
examples in `docs/examples`.

### [Earthquakes][earthquakes]

USGS provides [GeoJSON(P) files][usgs] with earthquake data, including time and
magnitude. For this example, that data is read, parsed to the right format
(`start` and `end` values in the GeoJSON `properties`), and added to a
`Leaflet.timeline`.

### [Country borders after WWII][borders]

I found some historical country border data [here][border-data], though
unfortunately it was not in GeoJSON. I converted it with [ogr2ogr][]:

    $ ogr2ogr -f "GeoJSON" \
      -select CNTRY_NAME,COWSYEAR,COWSMONTH,COWSDAY,COWEYEAR,COWEMONTH,COWEDAY \
      borders.json cshapes.shp

then wrangled the data into the right format (docs/examples/borders-parse.js).
After that, it was just a matter of passing the data to `Leaflet.timeline` and
letting it handle everything.

## Usage

There are actually two classes here. `L.Timeline` and `L.TimelineSliderControl`.

### `L.Timeline`

`L.Timeline` is a subclass of `L.GeoJSON`, so use it as you would that. The data
you pass in should be something like this:

``` json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "start": "1970-01-01",
        "end": "2014-12-04"
      },
      "geometry": { ... }
    }
  ]
}
```

Though you can also pass in a `getInterval` function to parse the data as you
wish. (see below)

The date can really be any numerical value -- if you're using this for timed
data, a Unix timestamp (the ms version for easier JS usage) probably makes
sense.

#### Options

see also [all GeoJSON's options](http://leafletjs.com/reference.html#geojson)

##### `getInterval` (Function -- optional)

This is a function which should return an object with `start` and `end`
properties. By default it assumes a structure as above.

##### `drawOnSetTime` (Boolean -- optional, default `true`)

Make the layer draw as soon as `setTime` is called. If this is set to false, you
will need to call `updateDisplayedLayers()` manually when you want it to
actually update.

#### Events

##### `change`
Fired when the selected time changes (either through manually sliding or
through playback).

### `L.TimelineSliderControl`

This is the actual control that allows playback and whatnot. It can control
multiple `L.Timeline`s.

#### Options

##### `start`
*default: earliest `start` in GeoJSON*

The beginning/minimum value of the timeline.

##### `end`
*default: latest `end` in GeoJSON*

The end/maximum value of the timeline.

##### `position`
*default: bottomleft*

[Position](http://leafletjs.com/reference.html#control) for the timeline
controls. Probably doesn't really matter as you'll likely want to expand them
anyway.

#### `formatOutput`
*default: `(date) -> date.toString()`*

A function that takes in a Unix timestamp and outputs a string. Ideally for
formatting the timestamp, but hey, you can do whatever you want.

#### `enablePlayback`
*default: `true`*

Show playback controls (i.e. prev/play/pause/next).

### `enableKeyboardControls`
*default: `false`*

Allow playback to be controlled using the spacebar (play/pause) and
right/left arrow keys (next/previous).

#### `steps`
*default: 1000*

How many steps to break the timeline into. Each step will then be `(end-start) /
steps`. Only affects playback.

#### `duration`
*default: 10000*

Minimum time, in ms, for the playback to take. Will almost certainly actually
take at least a bit longer -- after each frame, the next one displays in
`duration/steps` ms, so each frame really takes frame processing time PLUS
step time.

#### `showTicks`
*default: true*

Show tick marks on slider (if the browser supports it), representing changes in
value(s).

#### `waitToUpdateMap`
*default: false*

Wait until the user is finished changing the date to update the map. By default,
both the map and the date update for every change. With complex data, this can
slow things down, so set this to true to only update the displayed date.

#### `autoPlay`
*default: false*

Slider starts playing automatically after loading.

## Methods

#### `setTime`
Sets the current timeline time. Will parse any dates in just about any format
you throw at it.

#### `getDisplayed`
Returns the original GeoJSON of the features that are currently being displayed
on the map.

## Contributing

To get the project running locally, clone this repo and run these commands
within the project folder:

```
npm install
npm test -- --watchAll
```

To view the examples, you'll need to build:

```
npm run build
```

Then open up the HTML files in the "docs/examples" folders in your browser.

Please create a pull request from your fork of the project, and provide details
of the intent of the changes.

## Change log

### 1.4.0
- Migrate to Typescript
- Upgrade [Diesal][] dependency to improve performance on large datasets

### 1.3.0
- Add aria-labels (#136)
- Add autoplay option (#116)

### 1.0.0
- 100% test coverage
- BUGFIX: `times` is no longer shared among all Timeline instances
- Switch to pointer events for better mobile support (hopefully)
- More build tweaks, including setting up a dev server

### 1.0.0-beta
- Completely rewrote in ES6
- Overhauled build system with webpack
- Separated layer from control, allowing the control to handle multiple
  layers at the same time
- Added tests!

### 0.4.3
- Build tweaks

### 0.4.2
- Fixed a version check issue

### 0.4.1
- Fixed an issue where removing the L.timeline would not remove the control

### 0.4.0
- Fixed an issue where too wide of a range of dates would case playback to go
  backwards
- Added options to pass in methods to handle the data, so you can use a different
  format if you want
- Added a grunt build pipeline (thanks to @vencax for this and the two changes above)
- Fixed a bug where next/previous buttons wouldn't work as expected if input
  wasn't sorted (.. by sorting the input)


### 0.3.0
- Fixed Pause button not turning back into Play button on playback completion
- Fixed clicks on control buttons zooming map
- Fixed `getDisplayed` and event timing
- Major performance improvements
- Add `waitToUpdateMap` option to allow dragging the slider without updating
  the map until user is done

### 0.2.0
- Added previous/next/pause
- Change behavior of play button (will play from wherever it is rather than
  reset to the beginning)
- Lots of code restructuring
- Add more extensive default styling, using Sass

### 0.1.0
- It kinda works?

[Leaflet Realtime]: https://github.com/perliedman/leaflet-realtime
[LeafletPlayback]: https://github.com/hallahan/LeafletPlayback
[Diesal]: https://skeate.github.io/diesal
[earthquakes]: ./examples/earthquakes.html
[usgs]: https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
[borders]: ./examples/borders.html
[border-data]: http://nils.weidmann.ws/projects/cshapes
[ogr2ogr]: https://www.gdal.org/ogr2ogr.html
