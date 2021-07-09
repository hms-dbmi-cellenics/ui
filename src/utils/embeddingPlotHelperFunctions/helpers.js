import * as d3Chromatic from 'd3-scale-chromatic';
import * as d3 from 'd3-scale';

import { union } from '../cellSetOperations';

const hexToRgb = (hex) => {
  if (hex) {
    return hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i,
      (m, r, g, b) => `#${r}${r}${g}${g}${b}${b}`)
      .substring(1).match(/.{2}/g)
      .map((x) => parseInt(x, 16));
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

  const scaleFunction = d3.scaleSequential(d3Chromatic.interpolateViridis)
    .domain([min, max]);
  const cellColoring = {};

  expression.forEach((expressionValue, cellId) => {
    cellColoring[cellId] = hexToRgb(scaleFunction(expressionValue));
  });

  return cellColoring;
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
};
