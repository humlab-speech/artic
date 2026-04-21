'use strict';

const {
  hasAudioBuffer,
  getCanvasX,
  getCanvasY,
} = require('../../../src/svelte-app/utils/canvas-interaction');

describe('canvas interaction utils', function () {
  it('should treat non-enumerable audio buffer properties as valid', function () {
    var audioBuffer = {};
    Object.defineProperty(audioBuffer, 'length', {
      value: 16000,
      enumerable: false,
      configurable: true,
    });

    expect(Object.keys(audioBuffer).length).toEqual(0);
    expect(hasAudioBuffer(audioBuffer)).toBe(true);
  });

  it('should preserve zero offsetX when scaling mouse coordinates', function () {
    var target = {
      width: 200,
      clientWidth: 100,
      height: 120,
      clientHeight: 60,
      getBoundingClientRect: function () {
        return { left: 25, top: 10, width: 100, height: 60 };
      },
    };
    var event = {
      target: target,
      offsetX: 0,
      clientX: 60,
    };

    expect(getCanvasX(event)).toEqual(0);
  });

  it('should fall back to client coordinates when offset coordinates are unavailable', function () {
    var target = {
      width: 200,
      clientWidth: 100,
      height: 120,
      clientHeight: 60,
      getBoundingClientRect: function () {
        return { left: 25, top: 10, width: 100, height: 60 };
      },
    };
    var event = {
      target: target,
      clientX: 75,
      clientY: 40,
    };

    expect(getCanvasX(event)).toEqual(100);
    expect(getCanvasY(event)).toEqual(60);
  });
});
