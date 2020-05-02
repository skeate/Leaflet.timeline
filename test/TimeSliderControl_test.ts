import L = require("leaflet");
import simulant from "simulant";
import "../src/TimelineSliderControl";

describe("TimeSliderControl", () => {
  let map: L.Map;

  beforeEach(() => {
    const mapDiv = document.createElement("div");
    mapDiv.id = "map";
    document.body.appendChild(mapDiv);
    const osmUrl = "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    const osmAttrib =
      '&copy; <a href="http://openstreetmap.org/copyright">' +
      "OpenStreetMap</a> contributors";
    const osm = L.tileLayer(osmUrl, {
      maxZoom: 18,
      attribution: osmAttrib,
      noWrap: true
    });
    map = L.map("map", {
      layers: [osm],
      center: new L.LatLng(0, 0),
      zoom: 3,
      maxBounds: [
        [90, -180],
        [-90, 180]
      ]
    });
  });

  afterEach(() => {
    const mapDiv = document.getElementById("map");
    mapDiv?.parentNode?.removeChild(mapDiv);
  });

  it("should add the control", () => {
    const control = L.timelineSliderControl();
    control.addTo(map);
    expect(
      document.getElementsByClassName("leaflet-timeline-control").length
    ).toEqual(1);
    expect(document.getElementsByClassName("time-slider").length).toEqual(1);
  });

  describe("options", () => {
    it("should allow for start/end setting", () => {
      const control = L.timelineSliderControl({
        start: 100,
        end: 200
      });
      control.addTo(map);
      const slider = document.getElementsByClassName(
        "time-slider"
      )[0] as HTMLInputElement;
      expect(slider.min).toEqual("100");
      expect(slider.max).toEqual("200");
    });

    it("should have an option to avoid updating as user is changing slider", () => {
      const control = L.timelineSliderControl({
        start: 100,
        end: 300,
        waitToUpdateMap: true
      });
      control.setTime(100);
      control.addTo(map);
      const slider = document.getElementsByClassName(
        "time-slider"
      )[0] as HTMLInputElement;
      const timelineMock = {
        start: 50,
        end: 250,
        times: [50, 200, 250],
        setTime: jest.fn()
      };
      control.addTimelines(timelineMock as any);
      timelineMock.setTime.mockReset(); // just adding it calls it once
      slider.value = "205";
      simulant.fire(slider, "input");
      expect(timelineMock.setTime).not.toHaveBeenCalled();
      simulant.fire(slider, "change");
      expect(timelineMock.setTime).toHaveBeenCalled();
    });

    it("should have an option to not show the timeline ticks", () => {
      const control = L.timelineSliderControl({
        showTicks: false
      });
      control.addTo(map);
      const timelineMock = {
        start: 50,
        end: 250,
        times: [50, 200, 250],
        setTime: jest.fn()
      };
      control.addTimelines(timelineMock as any);
      expect(document.getElementsByTagName("datalist").length).toEqual(0);
      control.removeTimelines(timelineMock as any);
    });

    it("should have an option to not allow playback", () => {
      const control = L.timelineSliderControl({
        enablePlayback: false
      });
      control.addTo(map);
      expect(
        document.getElementsByClassName("sldr-ctrl-container").length
      ).toEqual(0);
    });

    it("should have an option for autoplay", () => {
      const control = L.timelineSliderControl({
        autoPlay: true
      });
      const playSpy = jest.spyOn(control, "play");
      control.addTo(map);
      expect(playSpy).toHaveBeenCalled();
    });
  });

  describe("keybindings", () => {
    let control: L.TimelineSliderControl;

    beforeEach(() => {
      control = L.timelineSliderControl({
        enableKeyboardControls: true
      });
      control.addTo(map);
    });

    afterEach(() => {
      control.remove();
    });

    it("should bind and remove key listeners", () => {
      expect(control._listener).toBeTruthy();
      const keydownSpy = jest.spyOn(control, "_onKeydown");
      simulant.fire(document, "keydown", { which: 65 });
      expect(keydownSpy).toHaveBeenCalled();
      keydownSpy.mockRestore();
    });

    it("should bind left to prev", () => {
      const timelineMock = {
        start: 50,
        end: 250,
        times: [50, 200, 250],
        setTime: jest.fn()
      };
      control.addTimelines(timelineMock as any);
      const prevSpy = jest.spyOn(control, "prev");
      simulant.fire(document, "keydown", {
        which: 37
      });
      expect(prevSpy).toHaveBeenCalled();
      prevSpy.mockRestore();
    });

    it("should bind right to next", () => {
      const timelineMock = {
        start: 50,
        end: 250,
        times: [50, 200, 250],
        setTime: jest.fn()
      };
      control.addTimelines(timelineMock as any);
      const nextSpy = jest.spyOn(control, "next");
      simulant.fire(document, "keydown", {
        which: 39
      });
      expect(nextSpy).toHaveBeenCalled();
      nextSpy.mockRestore();
    });

    it("should bind space to toggle", () => {
      const toggleSpy = jest.spyOn(control, "toggle");
      simulant.fire(document, "keydown", {
        which: 32
      });
      expect(toggleSpy).toHaveBeenCalled();
      toggleSpy.mockRestore();
    });
  });

  describe("controls", () => {
    xit("should prevent dragging the map when dragging the slider", () => {
      const enspy = jest.spyOn(map.dragging, "enable");
      const disspy = jest.spyOn(map.dragging, "disable");
      const control = L.timelineSliderControl();
      control.addTo(map);
      const slider = document.getElementsByClassName("time-slider")[0];
      simulant.fire(slider, "mouseenter");
      expect(disspy).toHaveBeenCalled();
      simulant.fire(slider, "mouseleave");
      expect(enspy).toHaveBeenCalled();
    });

    it("should call the corresponding method when buttons are pressed", () => {
      const control = L.timelineSliderControl({
        start: 100,
        end: 200
      });
      control.addTo(map);
      const timelineMock = {
        start: 50,
        end: 250,
        times: [50, 200, 250],
        setTime: jest.fn()
      };
      control.addTimelines(timelineMock as any);
      const prevSpy = jest.spyOn(control, "prev");
      const nextSpy = jest.spyOn(control, "next");
      const playSpy = jest.spyOn(control, "play");
      const pauseSpy = jest.spyOn(control, "pause");
      const prev = document.getElementsByClassName("prev")[0];
      const play = document.getElementsByClassName("play")[0];
      const pause = document.getElementsByClassName("pause")[0];
      const next = document.getElementsByClassName("next")[0];
      simulant.fire(prev, "click");
      expect(prevSpy).toHaveBeenCalled();
      simulant.fire(play, "click");
      expect(playSpy).toHaveBeenCalled();
      simulant.fire(pause, "click");
      expect(pauseSpy).toHaveBeenCalled();
      simulant.fire(next, "click");
      expect(nextSpy).toHaveBeenCalled();
    });
  });

  describe("interactions with layers", () => {
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
        this.times
          .slice()
          .sort((a, b) => a - b)
          .reduce((a, b) => {
            minGap = Math.min(minGap, b - a);
            return b;
          });
        return minGap;
      },
      setTime: jest.fn()
    };
    const fakeLayerA = Object.create(FakeLayer, {
      times: { value: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }
    });
    const fakeLayerB = Object.create(FakeLayer, {
      times: { value: [2, 3.5, 5, 7, 132, 765, 546] }
    });

    it("should add/remove timeline layers", () => {
      const control = L.timelineSliderControl();
      control.addTo(map);
      const slider = document.getElementsByClassName(
        "time-slider"
      )[0] as HTMLInputElement;
      expect(slider.min).toEqual("0");
      expect(slider.max).toEqual("0");
      control.addTimelines(fakeLayerA, fakeLayerB);
      control.addTimelines(fakeLayerA);
      expect(slider.min).toEqual("1");
      expect(slider.max).toEqual("765");
      control.removeTimelines(fakeLayerA);
      control.removeTimelines(fakeLayerA);
      expect(slider.min).toEqual("2");
      expect(slider.max).toEqual("765");
      control.removeTimelines(fakeLayerB);
      expect(slider.min).toEqual("0");
      expect(slider.max).toEqual("0");
      control.addTimelines(fakeLayerB);
      control.addTimelines(fakeLayerA);
      expect(slider.min).toEqual("1");
      expect(slider.max).toEqual("765");
    });

    it("should call a layer's setTime method on update", () => {
      const control = L.timelineSliderControl();
      control.addTo(map);
      control.addTimelines(fakeLayerA, fakeLayerB, fakeLayerA);
      expect(fakeLayerA.setTime).toHaveBeenCalled();
      expect(fakeLayerB.setTime).toHaveBeenCalled();
    });

    it("should allow next/prev event navigation", () => {
      const control = L.timelineSliderControl();
      control.addTo(map);
      control.addTimelines(fakeLayerA, fakeLayerB, fakeLayerA);
      expect(control.time).toEqual(1);
      control.next();
      expect(control.time).toEqual(2);
      control.next();
      expect(control.time).toEqual(3);
      control.next();
      expect(control.time).toEqual(3.5);
      control.next();
      control.next();
      control.prev();
      expect(control.time).toEqual(4);
      control.prev();
      expect(control.time).toEqual(3.5);
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
      expect(control.time).toEqual(765);
    });

    it("should allow playback and pausing", done => {
      const control = L.timelineSliderControl();
      control.addTo(map);
      control.addTimelines(fakeLayerA, fakeLayerB, fakeLayerA);
      const firstTime = control.time;
      control.toggle();
      setTimeout(() => {
        control.toggle();
        expect(control.time).not.toEqual(firstTime);
        done();
      }, 200);
    });

    it("should stop playback once it reaches the end", done => {
      const control = L.timelineSliderControl({
        duration: 5,
        steps: 5
      });
      control.addTo(map);
      control.addTimelines(fakeLayerA);
      control.play();
      expect(control.container?.classList.contains("playing")).toEqual(true);
      setTimeout(() => {
        expect(control.container?.classList.contains("playing")).toEqual(false);
        control.play();
        expect(control.container?.classList.contains("playing")).toEqual(true);
        setTimeout(() => {
          expect(control.container?.classList.contains("playing")).toEqual(
            false
          );
          done();
        }, 200);
      }, 200);
    });
  });

  describe("events", () => {
    it("should enable dragging when removed", () => {
      const mde = jest.spyOn(map.dragging, "enable");
      const control = L.timelineSliderControl();
      control.addTo(map);
      control.remove();
      expect(mde).toHaveBeenCalled();
      mde.mockRestore();
    });
  });

  describe("other", () => {
    it("should be able to synchronize multiple controls", () => {
      const a = L.timelineSliderControl();
      a.addTo(map);
      const b = L.timelineSliderControl();
      b.addTo(map);
      const bplay = jest.spyOn(b, "play");
      const bpause = jest.spyOn(b, "pause");
      const c = L.timelineSliderControl();
      c.addTo(map);
      const cplay = jest.spyOn(c, "play");
      const cpause = jest.spyOn(c, "pause");
      a.syncControl(b);
      a.syncControl(c);
      a.play();
      expect(bplay).toHaveBeenCalled();
      expect(cplay).toHaveBeenCalled();
      bplay.mockRestore();
      cplay.mockRestore();
      a.pause();
      expect(bpause).toHaveBeenCalled();
      expect(cpause).toHaveBeenCalled();
      bpause.mockRestore();
      cpause.mockRestore();
    });
  });
});
