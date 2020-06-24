import * as d3Chromatic from 'd3-scale-chromatic';
import * as d3 from 'd3-scale';

const hexToRgb = (hex) => {
  if (hex) {
    return hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i,
      (m, r, g, b) => `#${r}${r}${g}${g}${b}${b}`)
      .substring(1).match(/.{2}/g)
      .map((x) => parseInt(x, 16));
  }
  return null;
};

const convertColorData = (colorData) => {
  const colors = {};
  if (colorData) {
    colorData.forEach((cellSet) => {
      const rgbColor = hexToRgb(cellSet.color);
      if (cellSet.cellIds) {
        cellSet.cellIds.forEach((cell) => {
          colors[cell] = rgbColor;
        });
      }
    });
  }

  return colors;
};

const createColorScale = (cells, expressions, min, max) => {
  const scaleFunction = d3.scaleSequential(d3Chromatic.interpolateViridis)
    .domain([min, max]);
  const cellColoring = {};
  let index = 0;
  expressions.forEach((expression) => {
    cellColoring[cells[index]] = hexToRgb(scaleFunction(expression));
    index += 1;
  });
  return cellColoring;
};

const convertCellsData = (results) => {
  const data = {};

  Object.entries(results).forEach(([key, value]) => {
    data[key] = {
      mappings: {
        PCA: value,
      },
    };
  });

  return data;
};

const updateStatus = () => { };
const updateViewInfo = () => { };
const clearPleaseWait = () => { };

export {
  convertColorData,
  convertCellsData,
  updateStatus,
  updateViewInfo,
  clearPleaseWait,
  createColorScale,
};
