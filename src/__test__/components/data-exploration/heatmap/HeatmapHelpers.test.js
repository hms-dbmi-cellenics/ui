import { hexToRgb, convertRange } from 'components/plots/helpers/heatmap/utils';

describe('hexToRgb', () => {
  it('converts a hex to array of [r, g, b]', () => {
    const hex = '#5d2f86';
    const expectedRGB = [93, 47, 134];
    const res = hexToRgb(hex);
    expect(res).toEqual(expectedRGB);
  });

  it('returns null if hex is falsy', () => {
    const hex = '';
    const expectedRGB = null;
    const res = hexToRgb(hex);
    expect(res).toEqual(expectedRGB);
  });
});

describe('convertRange', () => {
  const values = [0, 0.5, 1];

  it('converts from one range to another', () => {
    const expectedOut = [0, 5, 10];
    const res = values.map((value) => convertRange(value, [0, 1], [0, 10]));
    expect(res).toEqual(expectedOut);
  });

  it('returns the original value if input range min and max are equal', () => {
    const res = values.map((value) => convertRange(value, [0, 0], [0, 10]));
    expect(res).toEqual(values);
  });
});
