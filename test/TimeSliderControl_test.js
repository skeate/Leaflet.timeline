/* global L, chai, should, sinon */
/* eslint-disable no-unused-expressions */

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

  it('should bind and remove key listeners', () => {
    const control = L.timelineSliderControl({
      enableKeyboardControls: true,
    });
    control.addTo(map);
    should.exist(control._listener);
    control.removeFrom(map);
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
      control.addTimelines(fakeLayerA, fakeLayerB, fakeLayerA);
      slider.min.should.equal('1');
      slider.max.should.equal('765');
      control.removeTimelines(fakeLayerA);
      slider.min.should.equal('2');
      slider.max.should.equal('765');
      control.removeTimelines(fakeLayerB);
      slider.min.should.equal('0');
      slider.max.should.equal('0');
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
      control.play();
      setTimeout(() => {
        control.pause();
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
      control.addTimelines(fakeLayerA, fakeLayerB, fakeLayerA);
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
});
