import * as d3Chromatic from 'd3-scale-chromatic';
import * as d3 from 'd3-scale';

import { union } from '../cellSetOperations';

const colorInterpolator = d3Chromatic.interpolatePurples;

const hexToRgb = (hex) => {
  if (hex) {
    return hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i,
      (m, r, g, b) => `#${r}${r}${g}${g}${b}${b}`)
      .substring(1).match(/.{2}/g)
      .map((x) => parseInt(x, 16));
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

const colorByGeneExpression = (focusedGene) => {
  // Use truncated values for coloring
  const { expression, min, max } = focusedGene.truncatedExpression;

  // this sometimes generates hex (e.g. '#000000') and sometimes rgb colour
  // (e.g. 'rgb(0, 0, 0)') strings for different interpolators. Amazing.
  // So if you change the interpolators and the colours break, use hexToRgb
  // instead!
  const scaleFunction = d3.scaleSequential([min, max], colorInterpolator);

  return Object.fromEntries(expression.map(
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

export {
  renderCellSetColors,
  convertCellsData,
  updateStatus,
  clearPleaseWait,
  colorByGeneExpression,
  colorInterpolator,
};
