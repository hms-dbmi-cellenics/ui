/* eslint-disable no-param-reassign */

import { getAllCells, getSampleCells } from 'utils/cellSets';

const generateSpec = (config, method, imageData, plotData) => {
  const { imageUrl, imageWidth, imageHeight } = imageData;

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
    legend = [
      {
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

  let marks = [{
    type: 'symbol',
    clip: true,
    from: { data: 'plotData' },
    encode: {
      update: {
        x: { scale: 'x', field: 'x' },
        y: { scale: 'y', field: 'flipped_y' },
        size: [
          { value: config?.marker.size },
        ],
        stroke: config?.marker.outline ? {
          scale: 'color',
          field: 'value',
        } : null,
        fill: {
          scale: 'color',
          field: 'value',
        },
        // TODO: make selectable (hexagon)
        shape: { value: config?.marker.shape },
        fillOpacity: { value: config.marker.opacity / 10 },
      },
    },
  }];
  if (config.showImage) {
    marks = [
      {
        type: 'image',
        clip: true,
        encode: {
          update: {
            url: { value: imageUrl },
            x: { signal: 'scale("x", 0)' }, // Use scale signal directly
            y: { signal: `scale("y", ${imageHeight})` }, // Use "scale" function with y
            width: { signal: `scale("x", ${imageWidth}) - scale("x", 0)` }, // Calculate width using scale domain
            height: { signal: `scale("y", 0) - scale("y", ${imageHeight})` }, // Calculate height using scale domain
            aspect: { value: false },
            opacity: { value: 1 },
          },
        },
      },
      ...marks,

    ];
  }

  let axes = [];
  if (config.axes.enabled) {
    axes = [
      {
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
      },
      {
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
      },
    ];
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
        format: {
          type: 'json',
          copy: true,
        },
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
    title:
    {
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

const generateData = (
  cellSets,
  selectedSample,
  plotData,
  embeddingData,
) => {
  const filteredCells = filterCells(cellSets, selectedSample, embeddingData);

  const cells = embeddingData
    .map((coordinates, cellId) => ({ cellId, coordinates }))
    .filter(({ coordinates }) => coordinates !== undefined)
    .filter(({ cellId }) => filteredCells.has(cellId))
    .map((data) => {
      const { cellId, coordinates } = data;

      return {
        x: coordinates[0],
        y: coordinates[1],
        value: plotData[cellId],
      };
    });

  return cells;
};

export {
  generateSpec,
  generateData,
};
