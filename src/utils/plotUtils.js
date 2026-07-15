import * as vega from 'vega';

import { union } from 'utils/cellSetOperations';

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

const colorByGeneExpression = (truncatedExpression, colorInterpolator, min, max = 4) => {
  // eslint-disable-next-line no-param-reassign
  if (max === 0) max = 4;

  const scaleFunction = vega.scale('sequential')()
    .domain([min, max])
    .interpolator(colorInterpolator);
  return Object.fromEntries(truncatedExpression.map(
    (expressionValue, cellId) => [cellId, cssRgbToRgb(scaleFunction(expressionValue))]
    ,
  ));
};

const convertCellsData = (results, hidden, properties) => {
  const data = [[], []];
  const obsEmbeddingIndex = [];

  const hiddenCells = union([...hidden], properties);
  results.forEach((value, key) => {
    if (hiddenCells.has(key)) {
      return;
    }
    // Skip cells with no embedding data (empty array)
    if (!value || !Array.isArray(value) || value.length !== 2) {
      return;
    }
    data[0].push(value[0]);
    data[1].push(value[1]);
    obsEmbeddingIndex.push(key.toString());
  });

  return {
    obsEmbedding: { data, shape: [data.length, results.length] },
    obsEmbeddingIndex,
  };
};

const offsetCentroids = (
  results, properties, sampleIds, perImageShape, gridShape, sampleRowCol = null,
) => {
  const [imageHeight, imageWidth] = perImageShape;
  const numColumns = gridShape[1];

  // Pre-calculate offsets for each sampleId. sampleRowCol (from
  // buildSpatialGridLayout) places grouped samples; without it, fall back to
  // dense row-major placement.
  const sampleOffsets = sampleIds.map((sampleId, sampleIndex) => {
    const rowCol = sampleRowCol?.[sampleIndex];
    const row = rowCol ? rowCol.row : Math.floor(sampleIndex / numColumns);
    const column = rowCol ? rowCol.col : sampleIndex % numColumns;
    return {
      xOffset: column * imageWidth,
      yOffset: row * imageHeight,
    };
  });

  // Build a sparse array indexed by cell id. Cells with no coordinates
  // (filtered/QC-failed cells are null in the worker result, matching the
  // standard embedding) are left as holes, so every consumer's forEach skips
  // them automatically — same as filterPolygons/convertCellsData.
  // Build a sparse array indexed by cell id. Filtered cells (absent from every
  // cluster) are excluded by the consumers via cellsInAnyCluster, so we keep the
  // behaviour identical to the image-driven path: every cell that maps to a
  // sample gets an entry (filtered cells may be [NaN, NaN] and are skipped
  // downstream).
  const offsetResults = [];
  results.forEach((coords, key) => {
    if (!coords) return;

    const sampleId = sampleIds.find((id) => properties[id]?.cellIds?.has(key));
    if (sampleId === undefined) return;

    const sampleIndex = sampleIds.indexOf(sampleId);
    const { xOffset, yOffset } = sampleOffsets[sampleIndex];

    const [x, y] = coords;
    offsetResults[key] = [x + xOffset, y + yOffset];
  });

  return offsetResults;
};

const convertRange = (value, r1, r2) => {
  // prevent devision by zero
  if (r1[0] === r1[1]) return value;

  // eslint-disable-next-line no-mixed-operators
  return (value - r1[0]) * (r2[1] - r2[0]) / (r1[1] - r1[0]) + r2[0];
};

export {
  renderCellSetColors,
  convertCellsData,
  colorByGeneExpression,
  offsetCentroids,
  hexToRgb,
  convertRange,
};
