/* eslint-disable no-param-reassign */

import { getAllCells, getSampleCells } from 'utils/cellSets';

const generateSpec = (config, viewState, method, imageData, plotData) => {
  console.log('viewState!!!');
  console.log(viewState);
  console.log(config);
  const selectedSample = config.selectedSample != 'All' ? config.selectedSample : imageData[0].sampleId;
  const { imageUrl, imageWidth, imageHeight } = imageData.find((item) => item.sampleId === selectedSample);

  const plotWidth = config.dimensions.width;
  const plotHeight = config.dimensions.height;

  let legend = [];

  if (config.legend.enabled) {
    legend = [
      {
        fill: 'color',
        type: 'gradient',
        orient: config.legend.position,
        title: config.shownGene,
        labelColor: config.colour.masterColour,
        titleColor: config.colour.masterColour,
        symbolType: 'circle',
        symbolSize: 100,
        offset: 40,
      }];
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
    signals: [
      // Signals for zooming and panning
      {
        name: 'initXdom',
        value: viewState.xdom,
      },
      {
        name: 'initYdom',
        value: viewState.ydom,
      },
      { name: 'xrange', update: '[0, width]' },
      { name: 'yrange', update: '[height, 0]' },
      {
        name: 'down',
        value: null,
        on: [
          { events: 'mousedown[!event.shiftKey]', update: 'xy()' },
          { events: 'mouseup[!event.shiftKey]', update: 'null' },
        ],
      },
      {
        name: 'xcur',
        value: null,
        on: [
          {
            events: 'mousedown',
            update: 'slice(xdom)',
          },
        ],
      },
      {
        name: 'ycur',
        value: null,
        on: [
          {
            events: 'mousedown',
            update: 'slice(ydom)',
          },
        ],
      },
      {
        name: 'delta',
        value: [0, 0],
        on: [
          {
            events: [
              {
                source: 'window',
                type: 'mousemove',
                between: [
                  { type: 'mousedown', filter: '!event.shiftKey' },
                  { source: 'window', type: 'mouseup' },
                ],
              },
            ],
            update: 'down ? [down[0]-x(), y()-down[1]] : [0,0]',
          },
        ],
      },
      {
        name: 'anchor',
        value: [0, 0],
        on: [
          {
            events: 'wheel',
            update: "[invert('xscale', x()), invert('yscale', y())]",
          },
        ],
      },
      {
        name: 'zoom',
        value: 1,
        on: [
          {
            events: 'wheel!',
            force: true,
            update: 'pow(1.001, event.deltaY * pow(2, event.deltaMode))',
          },
        ],
      },
      {
        name: 'xdom',
        update: 'initXdom',
        on: [
          {
            events: { signal: 'delta' },
            update: '[xcur[0] + span(xcur) * delta[0] / width, xcur[1] + span(xcur) * delta[0] / width]',
          },
          {
            events: { signal: 'zoom' },
            update: '[anchor[0] + (xdom[0] - anchor[0]) * zoom, anchor[0] + (xdom[1] - anchor[0]) * zoom]',
          },
        ],
      },
      {
        name: 'ydom',
        update: 'initYdom',
        on: [
          {
            events: { signal: 'delta' },
            update: '[ycur[0] + span(ycur) * delta[1] / height, ycur[1] + span(ycur) * delta[1] / height]',
          },
          {
            events: { signal: 'zoom' },
            update: '[anchor[1] + (ydom[0] - anchor[1]) * zoom, anchor[1] + (ydom[1] - anchor[1]) * zoom]',
          },
        ],
      },
      {
        name: 'symbolSize',
        update: `max(${config.marker.size} * width / span(xdom), ${config.marker.size})`,
      },
      {
        name: 'domUpdates',
        on: [
          {
            events: { signal: 'delta' },
            update: '[[xcur[0] + span(xcur) * delta[0] / width, xcur[1] + span(xcur) * delta[0] / width], [ycur[0] + span(ycur) * delta[1] / height, ycur[1] + span(ycur) * delta[1] / height]]',
          },
          {
            events: { signal: 'zoom' },
            update: '[[anchor[0] + (xdom[0] - anchor[0]) * zoom, anchor[0] + (xdom[1] - anchor[0]) * zoom], [anchor[1] + (ydom[0] - anchor[1]) * zoom, anchor[1] + (ydom[1] - anchor[1]) * zoom]]',
          },
        ],
      },
    ],
    scales: [
      {
        name: 'xscale',
        type: 'linear',
        zero: false,
        domain: { signal: 'xdom' },
        range: { signal: 'xrange' },
      },
      {
        name: 'yscale',
        type: 'linear',
        zero: false,
        domain: { signal: 'ydom' },
        range: { signal: 'yrange' },
      },
      {
        name: 'color',
        type: 'quantize',
        range: {
          scheme: config.colour.gradient === 'default'
            ? (config.colour.toggleInvert === '#FFFFFF' ? 'purplered' : 'darkgreen')
            : config.colour.gradient,
          count: 5,
        },
        domain: { data: 'plotData', field: 'value' },
        reverse: config.colour.reverseCbar,
      },
    ],
    // scales: [
    //   {
    //     name: 'x',
    //     type: 'linear',
    //     nice: true,
    //     zero: false,
    //     domain: xScaleDomain,
    //     range: 'width',
    //   },
    //   {
    //     name: 'y',
    //     type: 'linear',
    //     nice: true,
    //     zero: false,
    //     domain: yScaleDomain,
    //     range: 'height',
    //   },
    //   {
    //     name: 'color',
    //     type: 'quantize',
    //     range: {
    //       scheme: config.colour.gradient === 'default'
    //         ? (config.colour.toggleInvert === '#FFFFFF' ? 'purplered' : 'darkgreen')
    //         : config.colour.gradient,
    //       count: 5,
    //     },
    //     domain: { data: 'plotData', field: 'value' },
    //     reverse: config.colour.reverseCbar,
    //   },
    // ],
    axes: [
      {
        scale: 'xscale',
        grid: true,
        domain: true,
        orient: 'bottom',
        title: config.axes.xAxisText ?? `${method} 1`,
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
        scale: 'yscale',
        grid: false,
        domain: true,
        orient: 'left',
        titlePadding: 5,
        gridColor: config.colour.masterColour,
        gridOpacity: (config.axes.gridOpacity / 20),
        gridWidth: (config.axes.gridWidth / 20),
        tickColor: config.colour.masterColour,
        offset: config.axes.offset,
        title: config.axes.yAxisText ?? `${method} 2`,
        titleFont: config.fontStyle.font,
        labelFont: config.fontStyle.font,
        labelColor: config.colour.masterColour,
        titleFontSize: config.axes.titleFontSize,
        titleColor: config.colour.masterColour,
        labelFontSize: config.axes.labelFontSize,
        domainWidth: config.axes.domainWidth,
      },
    ],
    marks: [
      {
        type: 'image',
        clip: true,
        encode: {
          update: {
            url: { value: imageUrl },
            x: { signal: 'scale("xscale", 0)' }, // Use scale signal directly
            y: { signal: `scale("yscale", ${imageHeight})` }, // Use "scale" function with y
            width: { signal: `scale("xscale", ${imageWidth}) - scale("xscale", 0)` }, // Calculate width using scale domain
            height: { signal: `scale("yscale", 0) - scale("yscale", ${imageHeight})` }, // Calculate height using scale domain
            aspect: { value: false },
            opacity: { value: 1 },
          },
        },
      },
      {
        type: 'symbol',
        clip: true,
        from: { data: 'plotData' },
        encode: {
          update: {
            x: { scale: 'xscale', field: 'x' },
            y: { scale: 'yscale', field: 'flipped_y' },
            size: { signal: 'symbolSize' }, // Use the adjusted symbol size

            fill: {
              scale: 'color',
              field: 'value',
            },
            // TODO: make selectable (hexagon)
            shape: { value: config?.marker.shape },
            fillOpacity: { value: config.marker.opacity / 10 },
          },
        },
      },
    ],
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
