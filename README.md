# Leaflet.timeline 0.4.2

Show any changing geospatial data over time, from points to polygons.

If you want smooth motion of markers from point to point, this is not your
plugin. Please check out [LeafletPlayback][], or for real-time data, try
[Leaflet Realtime][], both plugins from which I may or may not have pilfered
some ideas.


## Examples

### [Earthquakes][1]

USGS provides [GeoJSON(P) files][2] with earthquake data, including time and
magnitude. For this example, that data is read, parsed to the right format
(`start` and `end` values in the GeoJSON `properties`), and added to a
`Leaflet.timeline`.

### [Country borders after WWII][3]

I found some historical country border data [here][4], though unfortunately
it was not in GeoJSON. I converted it with [ogr2ogr][5]:

    $ ogr2ogr -f "GeoJSON" \
      -select CNTRY_NAME,COWSYEAR,COWSMONTH,COWSDAY,COWEYEAR,COWEMONTH,COWEDAY \
      borders.json cshapes.shp

then wrangled the data into the right format (examples/borders-parse.js). After
that, it was just a matter of passing the data to `Leaflet.timeline` and letting
it handle everything.

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
        "end": "2014-12-04"
      },
      "geometry": { ... }
    }
  ]
}
```

The date can really be anything `Date()` can process.

It does add some extra options:

## Options

see also [all GeoJSON's options](http://leafletjs.com/reference.html#geojson)

#### `start`
*default: earliest `start` in GeoJSON*

The beginning/minimum value of the timeline.

#### `end`
*default: latest `end` in GeoJSON*

The end/maximum value of the timeline.

#### `position`
*default: bottomleft*

[Position](http://leafletjs.com/reference.html#control) for the timeline
controls. Probably doesn't really matter as you'll likely want to expand them
anyway.

#### `formatDate`
*default: `(date) -> ""`*

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

Show tick marks on slider, representing changes in value(s).

#### `waitToUpdateMap`
*default: false*

Wait until the user is finished changing the date to update the map. By default,
both the map and the date update for every change. With complex data, this can
slow things down, so set this to true to only update the displayed date.

#### `intervalFromFeature`

A function that should, given a feature, return an object with `start` and `end`
properties, representing the start time and end time of the feature. By default
it will use `feature.properties.start` and `feature.properties.end`.

## Events

#### `change`
Fired when the selected time changes (either through manually sliding or
through playback).

## Methods

#### `setTime`
Sets the current timeline time. Will parse any dates in just about any format
you throw at it.

#### `getDisplayed`
Returns the original GeoJSON of the features that are currently being displayed
on the map.

## Change log

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
[1]: http://skeate.github.io/Leaflet.timeline/earthquakes.html
[2]: http://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
[3]: http://skeate.github.io/Leaflet.timeline/borders.html
[4]: http://nils.weidmann.ws/projects/cshapes
[5]: http://www.gdal.org/ogr2ogr.html
