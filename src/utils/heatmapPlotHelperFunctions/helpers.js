const hexToRgb = (hex) => {
  if (hex) {
    const i = parseInt(hex.replace(/^#/, ''), 16);
    const r = (i >> 16) & 255;
    const g = (i >> 8) & 255;
    const b = i & 255;
    return [r, g, b];
  }
  return null;
};

const convertRange = (value, r1, r2) => (value - r1[0]) * (r2[1] - r2[0]) / (r1[1] - r1[0]) + r2[0];

const listToMatrix = (list, elementsPerSubArray) => {
  const matrix = []; let i; let
    k;

  for (i = 0, k = -1; i < list.length; i++) {
    if (i % elementsPerSubArray === 0) {
      k++;
      matrix[k] = [];
    }

    matrix[k].push(list[i]);
  }

  return matrix;
};

// eslint-disable-next-line
export { listToMatrix, hexToRgb, convertRange };
