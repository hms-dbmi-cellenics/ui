/* eslint-disable no-param-reassign */

import { getAllCells, getSampleCells } from 'utils/cellSets';

/**
 * @param {object}      config
 * @param {string}      method
 * @param {object}      imageData   { imageUrl, imageWidth, imageHeight, imageExtent }
 * @param {Array}       plotData
 * @param {object|null} segmentationOverlay  { overlayUrl, overlayExtent } | null
 */
const generateSpec = (config, method, imageData, plotData, segmentationOverlay = null) => {
  const {
    imageUrl, imageWidth, imageHeight, imageExtent,
  } = imageData;

  const xScaleDomain = config.axesRanges.xAxisAuto
    ? [0, imageWidth]
    : [config.axesRanges.xMin, config.axesRanges.xMax];

  const yScaleDomain = config.axesRanges.yAxisAuto
    ? [0, imageHeight]
    : [config.axesRanges.yMin, config.axesRanges.yMax];

  const plotWidth = config.dimensions.width;
  const plotHeight = config.dimensions.height;

  let legend = [];

  if (config.legend.enabled) {
    legend = [{
      fill: 'color',
      type: 'gradient',
      orient: config.legend.position,
      direction: ['left', 'right'].includes(config.legend.position) ? 'vertical' : 'horizontal',
      title: config.shownGene,
      labelColor: config.colour.masterColour,
      titleColor: config.colour.masterColour,
      symbolType: 'circle',
      symbolSize: 100,
      offset: 40,
    }];
  }

  const marks = [];

  // 1. Tissue image
  if (config.showImage) {
    const {
      xMin: ix1, xMax: ix2, yMin: iy1, yMax: iy2,
    } = imageExtent;
    marks.push({
      type: 'image',
      clip: true,
      encode: {
        update: {
          url: { value: imageUrl },
          x: { signal: `scale("x", ${ix1})` },
          y: { signal: `scale("y", ${iy2})` },
          width: { signal: `scale("x", ${ix2}) - scale("x", ${ix1})` },
          height: { signal: `scale("y", ${iy1}) - scale("y", ${iy2})` },
          aspect: { value: false },
          opacity: { value: 1 },
        },
      },
    });
  }

  // 2a. Segmentation overlay
  if (segmentationOverlay) {
    const { overlayUrl, overlayExtent } = segmentationOverlay;
    const {
      xMin: ox1, xMax: ox2, yMin: oy1, yMax: oy2,
    } = overlayExtent;
    marks.push({
      type: 'image',
      clip: true,
      encode: {
        update: {
          url: { value: overlayUrl },
          x: { signal: `scale("x", ${ox1})` },
          y: { signal: `scale("y", ${oy2})` },
          width: { signal: `scale("x", ${ox2}) - scale("x", ${ox1})` },
          height: { signal: `scale("y", ${oy1}) - scale("y", ${oy2})` },
          aspect: { value: false },
          opacity: { value: 1 },
        },
      },
    });
  } else {
    // 2b. Centroid dots — permanent fallback when no segmentation zarr available
    marks.push({
      type: 'symbol',
      clip: true,
      from: { data: 'plotData' },
      encode: {
        update: {
          x: { scale: 'x', field: 'x' },
          y: { scale: 'y', field: 'flipped_y' },
          size: [{ value: config?.marker.size }],
          stroke: config?.marker.outline ? { scale: 'color', field: 'value' } : null,
          fill: { scale: 'color', field: 'value' },
          shape: { value: config?.marker.shape },
          fillOpacity: { value: config.marker.opacity / 10 },
        },
      },
    });
  }

  const axes = [];

  if (config.axes.xAxisLabels) {
    axes.push({
      scale: 'x',
      grid: true,
      domain: true,
      orient: 'bottom',
      title: config.axes.xAxisText,
      titleFont: config.fontStyle.font,
      labelFont: config.fontStyle.font,
      labelColor: config.colour.masterColour,
      tickColor: config.colour.masterColour,
      gridColor: config.colour.masterColour,
      gridOpacity: (config.axes.gridOpacity / 20),
      gridWidth: (config.gridWidth / 20),
      offset: config.axes.offset,
      titleFontSize: config.axes.titleFontSize,
      titleColor: config.colour.masterColour,
      labelFontSize: config.axes.labelFontSize,
      domainWidth: config.axes.domainWidth,
      labelAngle: config.axes.xAxisRotateLabels ? 45 : 0,
      labelAlign: config.axes.xAxisRotateLabels ? 'left' : 'center',
    });
  }

  if (config.axes.yAxisLabels) {
    axes.push({
      scale: 'y',
      grid: false,
      domain: true,
      orient: 'left',
      titlePadding: 5,
      gridColor: config.colour.masterColour,
      gridOpacity: (config.axes.gridOpacity / 20),
      gridWidth: (config.axes.gridWidth / 20),
      tickColor: config.colour.masterColour,
      offset: config.axes.offset,
      title: config.axes.yAxisText,
      titleFont: config.fontStyle.font,
      labelFont: config.fontStyle.font,
      labelColor: config.colour.masterColour,
      titleFontSize: config.axes.titleFontSize,
      titleColor: config.colour.masterColour,
      labelFontSize: config.axes.labelFontSize,
      domainWidth: config.axes.domainWidth,
    });
  }

  return {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    description: 'Continuous embedding plot',
    width: plotWidth,
    height: plotHeight,
    autosize: { type: 'pad', resize: true },
    background: config.colour.toggleInvert,
    padding: 5,
    data: [
      {
        name: 'plotData',
        values: plotData,
        // Vega internally modifies objects during data transforms. If the plot data is frozen,
        // Vega is not able to carry out the transform and will throw an error.
        // https://github.com/vega/vega/issues/2453#issuecomment-604516777
        format: { type: 'json', copy: true },
        transform: [
          {
            type: 'formula',
            as: 'flipped_y',
            expr: `${imageHeight} - datum.y`,
          },
        ],
      },
    ],
    scales: [
      {
        name: 'x',
        type: 'linear',
        nice: false,
        zero: false,
        domain: xScaleDomain,
        range: 'width',
      },
      {
        name: 'y',
        type: 'linear',
        nice: false,
        zero: false,
        domain: yScaleDomain,
        range: 'height',
      },
      {
        name: 'color',
        type: 'linear',
        range: {
          scheme: config.colour.gradient === 'default'
            ? (config.colour.toggleInvert === '#FFFFFF' ? 'purplered' : 'darkgreen')
            : config.colour.gradient,
          count: 5,
        },
        domain: { data: 'plotData', field: 'value' },
        reverse: config.colour.gradient === 'spectral' || config.colour.reverseCbar,
      },
    ],
    axes,
    marks,
    legends: legend,
    title: {
      text: config.title.text,
      color: config.colour.masterColour,
      anchor: config.title.anchor,
      font: config.fontStyle.font,
      dx: config.title.dx,
      fontSize: config.title.fontSize,
    },
  };
};

const filterCells = (cellSets, selectedSample) => {
  let filteredCells = [];

  if (selectedSample === 'All') {
    filteredCells = getAllCells(cellSets);
  } else {
    filteredCells = getSampleCells(cellSets, selectedSample);
  }

  return new Set(filteredCells.map((cell) => cell.cellId));
};

const generateData = (cellSets, selectedSample, plotData, embeddingData) => {
  const filteredCells = filterCells(cellSets, selectedSample);

  return embeddingData
    .map((coordinates, cellId) => ({ cellId, coordinates }))
    .filter(({ coordinates }) => coordinates !== undefined)
    .filter(({ cellId }) => filteredCells.has(cellId))
    .map(({ cellId, coordinates }) => ({
      x: coordinates[0],
      y: coordinates[1],
      value: plotData[cellId],
    }));
};

export { generateSpec, generateData, filterCells };
