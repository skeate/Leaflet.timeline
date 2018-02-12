/* global L, sinon, should */

import simulant from 'simulant';
import '../src/TimelineSliderControl';

describe('TimeSliderControl', () => {
  let map;

  beforeEach(() => {
    const mapDiv = document.createElement('div');
    mapDiv.id = 'map';
    document.body.appendChild(mapDiv);
    const osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const osmAttrib = '&copy; <a href="http://openstreetmap.org/copyright">'
      + 'OpenStreetMap</a> contributors';
    const osm = L.tileLayer(osmUrl, {
      maxZoom: 18,
      attribution: osmAttrib,
      noWrap: true,
    });
    map = L.map('map', {
      layers: [osm],
      center: new L.LatLng(0, 0),
      zoom: 3,
      maxBounds: [[90, -180], [-90, 180]],
    });
  });

  afterEach(() => {
    const mapDiv = document.getElementById('map');
    mapDiv.parentNode.removeChild(mapDiv);
  });

  it('should add the control', () => {
    const control = L.timelineSliderControl();
    control.addTo(map);
    document.getElementsByClassName('leaflet-timeline-control').length
      .should.equal(1);
    document.getElementsByClassName('time-slider').length.should.equal(1);
  });

  describe('options', () => {
    it('should allow for start/end setting', () => {
      const control = L.timelineSliderControl({
        start: 100,
        end: 200,
      });
      control.addTo(map);
      const slider = document.getElementsByClassName('time-slider')[0];
      slider.min.should.equal('100');
      slider.max.should.equal('200');
    });

    it('should have an option to avoid updating as user is changing slider', () => {
      const control = L.timelineSliderControl({
        start: 100,
        end: 300,
        waitToUpdateMap: true,
      });
      control.setTime(100);
      control.addTo(map);
      const slider = document.getElementsByClassName('time-slider')[0];
      const timelineMock = {
        start: 50,
        end: 250,
        times: [50, 200, 250],
        setTime: sinon.spy(),
      };
      control.addTimelines(timelineMock);
      timelineMock.setTime.reset(); // just adding it calls it once
      slider.value = 205;
      simulant.fire(slider, 'input');
      timelineMock.setTime.should.not.have.been.called;
      simulant.fire(slider, 'change');
      timelineMock.setTime.should.have.been.called;
    });

    it('should have an option to not show the timeline ticks', () => {
      const control = L.timelineSliderControl({
        showTicks: false,
      });
      control.addTo(map);
      const timelineMock = {
        start: 50,
        end: 250,
        times: [50, 200, 250],
        setTime: sinon.spy(),
      };
      control.addTimelines(timelineMock);
      document.getElementsByTagName('datalist').length.should.equal(0);
      control.removeTimelines(timelineMock);
    });

    it('should have an option to not allow playback', () => {
      const control = L.timelineSliderControl({
        enablePlayback: false,
      });
      control.addTo(map);
      document.getElementsByClassName('sldr-ctrl-container').length.should.equal(0);
    });
  });

  describe('keybindings', () => {
    let control;

    beforeEach(() => {
      control = L.timelineSliderControl({
        enableKeyboardControls: true,
      });
      control.addTo(map);
    });

    afterEach(() => {
      control.remove(map);
    });

    it('should bind and remove key listeners', () => {
      should.exist(control._listener);
      sinon.spy(control, '_onKeydown');
      simulant.fire(document, 'keydown', { which: 65 });
      control._onKeydown.should.have.been.called;
      control._onKeydown.restore();
    });

    it('should bind left to prev', () => {
      sinon.spy(control, 'prev');
      simulant.fire(document, 'keydown', {
        which: 37,
      });
      control.prev.should.have.been.called;
      control.prev.restore();
    });

    it('should bind right to next', () => {
      sinon.spy(control, 'next');
      simulant.fire(document, 'keydown', {
        which: 39,
      });
      control.next.should.have.been.called;
      control.next.restore();
    });

    it('should bind left to prev', () => {
      sinon.spy(control, 'toggle');
      simulant.fire(document, 'keydown', {
        which: 32,
      });
      control.toggle.should.have.been.called;
      control.toggle.restore();
    });
  });

  describe('controls', () => {
    // unfortunately, simulant does not support pointer events as of 2017-02-25
    it.skip('should prevent dragging the map when dragging the slider', () => {
      sinon.spy(map.dragging, 'enable');
      sinon.spy(map.dragging, 'disable');
      const control = L.timelineSliderControl();
      control.addTo(map);
      const slider = document.getElementsByClassName('time-slider')[0];
      simulant.fire(slider, 'pointerdown');
      map.dragging.disable.should.have.been.called;
      simulant.fire(slider, 'pointerup');
      map.dragging.enable.should.have.been.called;
    });

    it('should call the corresponding method when buttons are pressed', () => {
      const control = L.timelineSliderControl({
        start: 100,
        end: 200,
      });
      control.addTo(map);
      sinon.spy(control, 'prev');
      sinon.spy(control, 'next');
      sinon.spy(control, 'play');
      sinon.spy(control, 'pause');
      const prev = document.getElementsByClassName('prev')[0];
      const play = document.getElementsByClassName('play')[0];
      const pause = document.getElementsByClassName('pause')[0];
      const next = document.getElementsByClassName('next')[0];
      simulant.fire(prev, 'click');
      control.prev.should.have.been.called;
      simulant.fire(play, 'click');
      control.play.should.have.been.called;
      simulant.fire(pause, 'click');
      control.pause.should.have.been.called;
      simulant.fire(next, 'click');
      control.next.should.have.been.called;

    });
  });

  describe('interactions with layers', () => {
    const FakeLayer = {
      times: [],
      get start() {
        if (this.times.length) {
          return Math.min(...this.times);
        }
        return 0;
      },
      get end() {
        if (this.times.length) {
          return Math.max(...this.times);
        }
        return 0;
      },
      get _minGap() {
        let minGap = Infinity;
        this.times.slice().sort((a, b) => a - b).reduce((a, b) => {
          minGap = Math.min(minGap, b - a);
          return b;
        });
        return minGap;
      },
      setTime: sinon.spy(),
    };
    const fakeLayerA = Object.create(FakeLayer, {
      times: {value: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]},
    });
    const fakeLayerB = Object.create(FakeLayer, {
      times: {value: [2, 3.5, 5, 7, 132, 765, 546]},
    });

    it('should add/remove timeline layers', () => {
      const control = L.timelineSliderControl();
      control.addTo(map);
      const slider = document.getElementsByClassName('time-slider')[0];
      slider.min.should.equal('0');
      slider.max.should.equal('0');
      control.addTimelines(fakeLayerA, fakeLayerB);
      control.addTimelines(fakeLayerA);
      slider.min.should.equal('1');
      slider.max.should.equal('765');
      control.removeTimelines(fakeLayerA);
      control.removeTimelines(fakeLayerA);
      slider.min.should.equal('2');
      slider.max.should.equal('765');
      control.removeTimelines(fakeLayerB);
      slider.min.should.equal('0');
      slider.max.should.equal('0');
      control.addTimelines(fakeLayerB);
      control.addTimelines(fakeLayerA);
      slider.min.should.equal('1');
      slider.max.should.equal('765');
    });

    it('should call a layer\'s setTime method on update', () => {
      const control = L.timelineSliderControl();
      control.addTo(map);
      control.addTimelines(fakeLayerA, fakeLayerB, fakeLayerA);
      fakeLayerA.setTime.should.have.been.called;
      fakeLayerB.setTime.should.have.been.called;
    });

    it('should allow next/prev event navigation', () => {
      const control = L.timelineSliderControl();
      control.addTo(map);
      control.addTimelines(fakeLayerA, fakeLayerB, fakeLayerA);
      control.time.should.equal(1);
      control.next();
      control.time.should.equal(2);
      control.next();
      control.time.should.equal(3);
      control.next();
      control.time.should.equal(3.5);
      control.next();
      control.next();
      control.prev();
      control.time.should.equal(4);
      control.prev();
      control.time.should.equal(3.5);
      control.next();
      control.next();
      control.next();
      control.next();
      control.next();
      control.next();
      control.next();
      control.next();
      control.next();
      control.next();
      control.next();
      control.time.should.equal(765);
    });

    it('should allow playback and pausing', (done) => {
      const control = L.timelineSliderControl();
      control.addTo(map);
      control.addTimelines(fakeLayerA, fakeLayerB, fakeLayerA);
      const firstTime = control.time;
      control.toggle();
      setTimeout(() => {
        control.toggle();
        control.time.should.not.equal(firstTime);
        done();
      }, 200);
    });

    it('should stop playback once it reaches the end', (done) => {
      const control = L.timelineSliderControl({
        duration: 5,
        steps: 5,
      });
      control.addTo(map);
      control.addTimelines(fakeLayerA);
      control.play();
      control.container.classList.contains('playing').should.equal(true);
      setTimeout(() => {
        control.container.classList.contains('playing').should.equal(false);
        control.play();
        control.container.classList.contains('playing').should.equal(true);
        setTimeout(() => {
          control.container.classList.contains('playing').should.equal(false);
          done();
        }, 200);
      }, 200);
    });
  });

  describe('events', () => {
    it('should register document events when added', () => {
      sinon.spy(L.DomEvent, 'on');
      const control = L.timelineSliderControl();
      control.addTo(map);
      const slider = document.getElementsByClassName('time-slider')[0];
      L.DomEvent.on.should.have.been.calledWith(document, 'pointerup mouseup touchend');
      L.DomEvent.on.restore();
    });

    it('should deregister document events when removed', () => {
      sinon.spy(L.DomEvent, 'off');
      const control = L.timelineSliderControl();
      control.addTo(map);
      control.remove();
      L.DomEvent.off.should.have.been.calledWith(document, 'pointerup mouseup touchend');
      L.DomEvent.off.restore();
    });

    it('should enable dragging when removed', () => {
      sinon.spy(map.dragging, 'enable');
      const control = L.timelineSliderControl();
      control.addTo(map);
      control.remove();
      map.dragging.enable.should.have.been.called;
      map.dragging.enable.restore();
    });
  });
});
