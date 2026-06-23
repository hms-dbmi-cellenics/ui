import {
  niceTicks, formatTick, isDarkColor, chromeToSvg, drawChromeToCanvas,
} from 'utils/spatial/deckPlotChrome';

describe('niceTicks', () => {
  it('returns evenly spaced round ticks within the range', () => {
    const ticks = niceTicks(0, 100, 6);
    expect(ticks).toEqual([0, 20, 40, 60, 80, 100]);
  });

  it('starts at the first nice multiple inside the range', () => {
    const ticks = niceTicks(12, 47, 5);
    // step 10 → first multiple ≥ 12 is 20
    expect(ticks[0]).toBe(20);
    expect(ticks[ticks.length - 1]).toBeLessThanOrEqual(47);
  });

  it('collapses floating-point noise', () => {
    const ticks = niceTicks(0, 1, 6);
    expect(ticks).toContain(0.6); // not 0.6000000000000001
  });

  it('returns [] for a degenerate or non-finite range', () => {
    expect(niceTicks(5, 5)).toEqual([]);
    expect(niceTicks(10, 0)).toEqual([]);
    expect(niceTicks(NaN, 10)).toEqual([]);
  });
});

describe('formatTick', () => {
  it('rounds large magnitudes to integers and trims small ones', () => {
    expect(formatTick(1234.5)).toBe('1235');
    expect(formatTick(2)).toBe('2');
    expect(formatTick(0.25)).toBe('0.3');
  });
});

describe('isDarkColor', () => {
  it('detects dark vs light backgrounds', () => {
    expect(isDarkColor('#000000')).toBe(true);
    expect(isDarkColor('#222222')).toBe(true);
    expect(isDarkColor('#FFFFFF')).toBe(false);
    expect(isDarkColor('#cccccc')).toBe(false);
    expect(isDarkColor(undefined)).toBe(false);
  });
});

describe('chromeToSvg', () => {
  const model = {
    rects: [{
      x: 1, y: 2, w: 3, h: 4, fill: '#ff0000',
    }],
    lines: [{
      x1: 0, y1: 0, x2: 10, y2: 0, stroke: '#000000', width: 1,
    }],
    texts: [{
      x: 5, y: 6, text: 'Gad1 & Sst', anchor: 'middle', size: 12, color: '#000000',
    }],
  };

  it('serialises the model + GL snapshot to an <svg> string', () => {
    const svg = chromeToSvg(model, {
      width: 100,
      height: 80,
      background: '#FFFFFF',
      imageHref: 'data:image/png;base64,AAAA',
      imageRect: [10, 10, 80, 60],
    });
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('<image');
    expect(svg).toContain('data:image/png;base64,AAAA');
    expect(svg).toContain('<rect x="1" y="2" width="3" height="4" fill="#ff0000"');
    expect(svg).toContain('<line x1="0" y1="0" x2="10" y2="0"');
    // text content is XML-escaped
    expect(svg).toContain('Gad1 &amp; Sst');
    expect(svg.endsWith('</svg>')).toBe(true);
  });
});

describe('drawChromeToCanvas', () => {
  it('draws every primitive onto the 2D context, scaled', () => {
    const calls = [];
    const ctx = {
      globalAlpha: 1,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      font: '',
      textAlign: '',
      textBaseline: '',
      fillRect: (...a) => calls.push(['fillRect', ...a]),
      strokeRect: (...a) => calls.push(['strokeRect', ...a]),
      beginPath: () => calls.push(['beginPath']),
      moveTo: (...a) => calls.push(['moveTo', ...a]),
      lineTo: (...a) => calls.push(['lineTo', ...a]),
      stroke: () => calls.push(['stroke']),
      fillText: (...a) => calls.push(['fillText', ...a]),
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
    };
    drawChromeToCanvas(ctx, {
      rects: [{
        x: 1, y: 1, w: 2, h: 2, fill: '#fff',
      }],
      lines: [{
        x1: 0, y1: 0, x2: 4, y2: 0, stroke: '#000',
      }],
      texts: [{
        x: 3, y: 3, text: 'X', color: '#000', size: 10,
      }],
    }, 2);

    // rect drawn at 2× scale
    expect(calls).toContainEqual(['fillRect', 2, 2, 4, 4]);
    // line endpoints at 2× scale
    expect(calls).toContainEqual(['moveTo', 0, 0]);
    expect(calls).toContainEqual(['lineTo', 8, 0]);
    expect(calls).toContainEqual(['fillText', 'X', 6, 6]);
  });
});
