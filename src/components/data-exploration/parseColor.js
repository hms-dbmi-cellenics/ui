const DEFAULT_GREY = [128, 128, 128, 255];

/**
 * Convert a colour value (hex string or RGB(A) array) to an RGBA array for
 * deck.gl layer accessors. Falls back to grey for missing/unparseable values.
 *
 * Shared by the deck.gl viewers (Embedding, SpatialViewer) so they don't each
 * carry their own copy.
 *
 * @param {string|number[]} colorValue  '#rrggbb' / 'rrggbb' / [r,g,b] / [r,g,b,a]
 * @returns {number[]} [r, g, b, a]
 */
const parseColor = (colorValue) => {
  if (!colorValue) return DEFAULT_GREY;

  // already an array — ensure an alpha channel
  if (Array.isArray(colorValue)) {
    return colorValue.length === 4 ? colorValue : [...colorValue, 255];
  }

  // parse a hex string
  if (typeof colorValue === 'string') {
    const hex = colorValue.startsWith('#') ? colorValue : `#${colorValue}`;
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16), 255];
    }
  }

  return DEFAULT_GREY;
};

export default parseColor;
