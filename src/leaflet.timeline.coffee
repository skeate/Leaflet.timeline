###
Leaflet.timeline

Show any arbitrary GeoJSON objects changing over time

(c) 2014 Jonathan Skeate
https://github.com/skeate/Leaflet.timeline
http://leafletjs.com
###

L.TimelineVersion = '0.2.0'

L.Timeline = L.GeoJSON.extend
  includes: L.Mixin.Events
  times: []
  ranges: []
  options:
    position: "bottomleft"
    formatDate: (date) -> ""
    enablePlayback: true
    steps: 1000
    duration: 10000
    updateMapOnDrag: true
    showTicks: true
  initialize: (@timedGeoJSON, options) ->
    L.GeoJSON.prototype.initialize.call this, undefined, options
    L.extend @options, options
    @process @timedGeoJSON

  process: (data) ->
    earliestStart = Infinity
    latestEnd = -Infinity
    data.features.forEach (feature) =>
      start = ( new Date feature.properties.start ).getTime()
      end = ( new Date feature.properties.end ).getTime()
      @ranges.push
        start: start
        end: end
        geoJSON: feature
      @times.push start
      @times.push end
      if start < earliestStart then earliestStart = start
      if end > latestEnd then latestEnd = end
    @times = @times.sort()
    if not @options.start then @options.start = earliestStart
    if not @options.end then @options.end = latestEnd

  setTime: (time) ->
    @fire 'timeline:change'
    @time = (new Date time).getTime()
    @clearLayers()
    @ranges.forEach (range) =>
      if range.start <= @time and range.end >= @time
        @addData range.geoJSON

  onAdd: (map) ->
    L.GeoJSON.prototype.onAdd.call this, map
    @timeSliderControl = L.Timeline.timeSliderControl this
    @timeSliderControl.addTo map

  getDisplayed: ->
    showing = @ranges.filter (r) -> r.start <= @time and r.end >= @time
    showing.map (shown) -> shown.geoJSON


L.Timeline.TimeSliderControl = L.Control.extend
  initialize: (@timeline) ->
    @options.position = @timeline.options.position
    @start = @timeline.options.start
    @end = @timeline.options.end
    @showTicks = @timeline.options.showTicks
    @stepDuration = @timeline.options.duration / @timeline.options.steps
    @stepSize = ( @end - @start ) / @timeline.options.steps
    
  _buildDataList: (container, times) ->
    @_datalist = L.DomUtil.create 'datalist', '', container
    datalistSelect = L.DomUtil.create 'select', '', @_datalist
    times.forEach (time) ->
      datalistOption = L.DomUtil.create 'option', '', datalistSelect
      datalistOption.value = time
    @_datalist.id = "timeline-datalist-" + Math.floor( Math.random() * 1000000 )
    @_timeSlider.setAttribute 'list', @_datalist.id

  _makePlayPause: (container) ->
    @_playButton = L.DomUtil.create 'button', 'play', container
    @_playButton.addEventListener 'click', => @_play()
    @_pauseButton = L.DomUtil.create 'button', 'pause', container
    @_pauseButton.addEventListener 'click', => @_pause()

  _makePrevNext: (container) ->
    @_prevButton = L.DomUtil.create 'button', 'prev'
    @_nextButton = L.DomUtil.create 'button', 'next'
    @_playButton.parentNode.insertBefore @_prevButton, @_playButton
    @_playButton.parentNode.insertBefore @_nextButton, @_pauseButton.nextSibling
    @_prevButton.addEventListener 'click', @_prev.bind @
    @_nextButton.addEventListener 'click', @_next.bind @

  _makeSlider: (container) ->
    @_timeSlider = L.DomUtil.create 'input', 'time-slider', container
    @_timeSlider.type = "range"
    @_timeSlider.min = @start
    @_timeSlider.max = @end
    @_timeSlider.value = @start
    @_timeSlider.addEventListener 'mousedown', => @map.dragging.disable()
    document.addEventListener     'mouseup',   => @map.dragging.enable()
    @_timeSlider.addEventListener 'input', @_sliderChanged.bind @
    @_timeSlider.addEventListener 'change', @_sliderChanged.bind @

  _makeOutput: (container) ->
    @_output = L.DomUtil.create 'output', 'time-text', container
    @_output.innerHTML = @timeline.options.formatDate new Date @start

  _nearestEventTime: (findTime, mode=0) ->
    retNext = false
    lastTime = @timeline.times[0]
    for time in @timeline.times[1..]
      if retNext then return time
      if time >= findTime
        if mode == -1
          return lastTime
        else if mode == 1
          if time == findTime then retNext = true
          else return time
        else
          prevDiff = Math.abs findTime - lastTime
          nextDiff = Math.abs time - findTime
          return if prevDiff < nextDiff then prevDiff else nextDiff
      lastTime = time
    lastTime

  _prev: (e) ->
    e.stopPropagation()
    @_pause()
    prevTime = @_nearestEventTime @timeline.time, -1
    @_timeSlider.value = prevTime
    @timeline.setTime prevTime

  _pause: ->
    clearTimeout @_timer
    @container.classList.remove 'playing'

  _play: ->
    clearTimeout @_timer
    if +@_timeSlider.value == @end then @_timeSlider.value = @start
    @_timeSlider.stepUp @stepSize
    @_sliderChanged { target: value: @_timeSlider.value }
    unless +@_timeSlider.value == @end
      @container.classList.add 'playing'
      @_timer = setTimeout @_play.bind @, @stepDuration

  _next: (e) ->
    e.stopPropagation()
    @_pause()
    nextTime = @_nearestEventTime @timeline.time, 1
    @_timeSlider.value = nextTime
    @timeline.setTime nextTime

  _sliderChanged: (e) ->
    time = +e.target.value
    @timeline.setTime time
    @_output.innerHTML = @timeline.options.formatDate new Date time

  onAdd: (@map) ->
    container = L.DomUtil.create 'div',
                    'leaflet-control-layers ' +
                    'leaflet-control-layers-expanded ' +
                    'leaflet-timeline-controls'
    buttonContainer = L.DomUtil.create 'div', 'button-container', container
    @_makePlayPause buttonContainer
    @_makeSlider container
    if @showTicks
      @_buildDataList container, @timeline.times
      @_makePrevNext buttonContainer
    @_makeOutput container
    @timeline.setTime @start
    @container = container

L.timeline = (timedGeoJSON, options) -> new L.Timeline timedGeoJSON, options
L.Timeline.timeSliderControl = (timeline, start, end, timelist) ->
  new L.Timeline.TimeSliderControl timeline, start, end, timelist
