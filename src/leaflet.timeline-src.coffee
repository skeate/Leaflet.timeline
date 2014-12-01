###
Leaflet.timeline

Show any arbitrary GeoJSON objects changing over time

(c) 2014 Jonathan Skeate
https://github.com/skeate/Leaflet.timeline
http://leafletjs.com
###

L.TimelineVersion = '0.1.0'

L.Timeline = L.GeoJSON.extend
  allData: []
  allDates: []
  initialize: (timedGeoJSON, @options) ->
    L.GeoJSON.prototype.initialize.call this, undefined, @options
    @_firstDate = Infinity
    @_lastDate = -Infinity
    if timedGeoJSON.features?
      timedGeoJSON.features.forEach (feature) =>
        startDate = ( new Date feature.properties.startDate ).getTime()
        endDate = ( new Date feature.properties.endDate ).getTime()
        @allData.push
          geoJSON: feature
          start: startDate
          end: endDate
        @allDates.push startDate
        @allDates.push endDate
        if startDate < @_firstDate then @_firstDate = startDate
        if endDate > @_lastDate then @_lastDate = endDate

  setTime: (time) ->
    @clearLayers()
    @allData.forEach (range) =>
      if range.start <= time and range.end >= time
        @addData range.geoJSON
  onAdd: (map) ->
    L.GeoJSON.prototype.onAdd.call this, map
    @dateSliderControl = L.Timeline.dateSliderControl this, @_firstDate, @_lastDate, @allDates
    @dateSliderControl.addTo map

L.Timeline.DateSliderControl = L.Control.extend
  options:
    position: 'bottomleft'
  initialize: (@timeline, @startDate, @endDate, @datelist) ->
  buildDataList: (dates, container) ->
    datalist = L.DomUtil.create 'datalist', '', container
    datalistSelect = L.DomUtil.create 'select', '', datalist
    dates.forEach (date) ->
      datalistOption = L.DomUtil.create 'option', '', datalistSelect
      datalistOption.value = date
    datalist
  onAdd: (map) ->
    @_container = L.DomUtil.create 'div',
                    'leaflet-control-layers ' +
                    'leaflet-control-layers-expanded ' +
                    'leaflet-timeline-controls'
    @_playButton = L.DomUtil.create 'button', 'play-button', @_container
    @_dateSlider = L.DomUtil.create 'input', 'date-slider', @_container
    @_dateText = L.DomUtil.create 'output', 'date-text', @_container
    @_dataList = @buildDataList @datelist, @_container
    @_dataList.id = Math.floor(Math.random() * 999999999)
    @_playButton.innerHTML = "&#9654;"
    @_dateSlider.type = "range"
    @_dateSlider.min = @startDate
    @_dateSlider.max = @endDate
    @_dateSlider.value = @startDate
    @_dateSlider.setAttribute 'list', @_dataList.id
    @_dateSlider.addEventListener 'mousedown', -> map.dragging.disable()
    sliderChanged = (e) =>
      time = +e.target.value
      @timeline.setTime time
      @_dateText.innerHTML = @timeline.options.formatDate new Date time
    @_dateSlider.addEventListener 'change', sliderChanged
    document.addEventListener 'mouseup', -> map.dragging.enable()
    @_dateText.innerHTML = @timeline.options.formatDate new Date @startDate
    @timeline.setTime @startDate
    @_playButton.addEventListener 'click', =>
      stepDuration = 10
      steps = 1000
      stepSize = (@endDate - @startDate) / 1000
      @_dateSlider.value = @startDate
      step = 0
      stepUp = =>
        @_dateSlider.stepUp stepSize
        sliderChanged {target:{value: @_dateSlider.value}}
        if ++step < steps
          setTimeout stepUp, stepDuration
      stepUp()
    @_container

L.timeline = (timedGeoJSON, options) -> new L.Timeline timedGeoJSON, options
L.Timeline.dateSliderControl = (timeline, start, end, datelist) ->
  new L.Timeline.DateSliderControl timeline, start, end, datelist
