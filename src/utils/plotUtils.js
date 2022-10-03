import * as vega from 'vega';

import { union } from 'utils/cellSetOperations';

const colorInterpolator = vega.scheme('purplered');

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

const cssRgbToRgb = (rgb) => {
  if (rgb) {
    return rgb.match(/\d+/g).map(Number);
  }
  return null;
};

const renderCellSetColors = (rootKey, cellSetHierarchy, cellSetProperties) => {
  const colors = {};

  // First, find the key you are focusing on.
  const [node] = cellSetHierarchy.filter((rootNode) => rootNode.key === rootKey);

  if (!node?.children) {
    return {};
  }

  // Extract children of root key.
  const cellSets = node.children.map((child) => child.key);

  cellSets.forEach((key) => {
    if (!(key in cellSetProperties)) {
      return {};
    }

    const { color: stringColor, cellIds } = cellSetProperties[key];
    const color = hexToRgb(stringColor);

    if (color && cellIds) {
      cellIds.forEach((cellId) => {
        colors[cellId] = color;
      });
    }
  });

  return colors;
};

const colorByGeneExpression = (truncatedExpression, min, max) => {
  const scaleFunction = vega.scale('sequential')()
    .domain([min, max])
    .interpolator(colorInterpolator);

  return Object.fromEntries(truncatedExpression.map(
    (expressionValue, cellId) => [cellId, cssRgbToRgb(scaleFunction(expressionValue))],
  ));
};

const convertCellsData = (results, hidden, properties) => {
  const data = {};

  const hiddenCells = union([...hidden], properties);
  results.forEach((value, key) => {
    if (hiddenCells.has(key)) {
      return;
    }

    data[key] = {
      mappings: {
        PCA: value,
      },
    };
  });

  return data;
};

const updateStatus = () => { };
const clearPleaseWait = () => { };

const convertRange = (value, r1, r2) => {
  // prevent devision by zero
  if (r1[0] === r1[1]) return value;

  // eslint-disable-next-line no-mixed-operators
  return (value - r1[0]) * (r2[1] - r2[0]) / (r1[1] - r1[0]) + r2[0];
};

export {
  renderCellSetColors,
  convertCellsData,
  updateStatus,
  clearPleaseWait,
  colorByGeneExpression,
  colorInterpolator,
  hexToRgb,
  convertRange,
};
