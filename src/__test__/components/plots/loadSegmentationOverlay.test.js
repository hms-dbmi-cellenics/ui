import {
  parseHexColor, paintSegOverlayPixels, colorSegmentationOverlay,
} from 'components/plots/loadSegmentationOverlay';

// Paint a decoded label tile into a fresh RGBA buffer (the pure pixel logic) and
// return it for inspection — no canvas needed.
const paint = (decoded, colorMap, options = {}) => {
  const w = decoded.innerW ?? decoded.regionW;
  const h = decoded.innerH ?? decoded.regionH;
  const px = new Uint8ClampedArray(w * h * 4);
  paintSegOverlayPixels(px, decoded, colorMap, options);
  return px;
};

// a 3x1 strip: cell 1 (label 1), cell 2 (label 2), background (0)
const decoded3x1 = {
  flatData: [1, 2, 0],
  regionW: 3,
  regionH: 1,
  innerX: 0,
  innerY: 0,
  innerW: 3,
  innerH: 1,
  extent: {
    xMin: 0, xMax: 3, yMin: 0, yMax: 1,
  },
};

describe('parseHexColor', () => {
  it('parses a 6-digit hex (with or without #) to [r, g, b]', () => {
    expect(parseHexColor('#ff8800')).toEqual([255, 136, 0]);
    expect(parseHexColor('ff8800')).toEqual([255, 136, 0]);
  });

  it('falls back to grey for short/empty/invalid input', () => {
    expect(parseHexColor('#fff')).toEqual([128, 128, 128]);
    expect(parseHexColor('')).toEqual([128, 128, 128]);
    expect(parseHexColor(undefined)).toEqual([128, 128, 128]);
  });
});

describe('colorSegmentationOverlay', () => {
  it('paints cells in the colour map and hides everything else', () => {
    // only cell id 0 (label 1) is in the active scheme
    const colorMap = new Map([[0, [255, 0, 0]]]);
    const px = paint(decoded3x1, colorMap, { opacity: 1, outline: false });

    // label 1 → red, fully opaque
    expect([px[0], px[1], px[2], px[3]]).toEqual([255, 0, 0, 255]);
    // label 2 not in the map (e.g. filtered out earlier) → transparent, NOT grey
    expect(px[7]).toBe(0);
    // background → transparent
    expect(px[11]).toBe(0);
  });

  it('applies the opacity slider to the cell fill alpha', () => {
    const colorMap = new Map([[0, [10, 20, 30]]]);
    const px = paint(decoded3x1, colorMap, { opacity: 0.5, outline: false });
    expect([px[0], px[1], px[2]]).toEqual([10, 20, 30]);
    expect(px[3]).toBe(Math.round(0.5 * 255)); // 128
  });

  it('outlines only cells in the colour map (filtered cells get no stray outline)', () => {
    const colorMap = new Map([[0, [255, 0, 0]]]);
    const px = paint(decoded3x1, colorMap, { opacity: 0.5, outline: true });

    // label 1 is an edge (neighbours differ) AND is coloured → outlined (alpha 255)
    expect(px[3]).toBe(255);
    // label 2 is an edge too but not in the map → no outline, stays hidden
    expect(px[7]).toBe(0);
  });

  it('respects a per-cell alpha override (4th colour element)', () => {
    const colorMap = new Map([[0, [1, 2, 3, 200]]]);
    const px = paint(decoded3x1, colorMap, { opacity: 1, outline: false });
    expect(px[3]).toBe(200);
  });

  it('returns null when there is no decoded tile', () => {
    expect(colorSegmentationOverlay(null, new Map())).toBeNull();
  });
});
