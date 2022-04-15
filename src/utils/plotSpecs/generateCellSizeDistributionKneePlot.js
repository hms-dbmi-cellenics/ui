import _ from 'lodash';

const generateSpec = (config, plotData) => {
  let legend = null;

  const minCellSizeItem = _.findLast(
    plotData,
    (element) => element.u >= config.minCellSize,
  );

  const minCellSizeRank = minCellSizeItem?.rank ?? 0;

  const generateStatus = `(datum.rank <= ${minCellSizeRank}) ? 'high' : 'low'`;

  legend = !config.legend.enabled ? null : [
    {
      fill: 'color',
      orient: config.legend.position,
      title: 'Quality',
      labelFont: config.fontStyle.font,
      titleFont: config.fontStyle.font,
      encode: {
        title: {
          update: {
            fontSize: { value: 14 },
          },
        },
        labels: {
          interactive: true,
          update: {
            fontSize: { value: 12 },
            fill: { value: 'black' },
          },
        },
        symbols: {
          update: {
            stroke: { value: 'transparent' },
          },
        },
        legend: {
          update: {
            stroke: { value: '#ccc' },
            strokeWidth: { value: 1.5 },
          },
        },
      },
    }];

  return {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    width: config.dimensions.width,
    height: config.dimensions.height,
    autosize: { type: 'fit', resize: true },
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
            as: 'status',
            expr: generateStatus,
          },
          {
            type: 'filter',
            expr: 'datum.u > 0 && datum.rank > 0',
          },
        ],
      },
      {
        name: 'lowerHalfPlotData',
        source: 'plotData',
        transform: [
          {
            type: 'filter',
            expr: `datum.rank <= ${minCellSizeRank}`,
          },
        ],
      },
      {
        name: 'higherHalfPlotData',
        source: 'plotData',
        transform: [
          {
            type: 'filter',
            expr: `datum.rank >= ${minCellSizeRank}`,
          },
        ],
      },
    ],

    scales: [
      {
        name: 'xscale',
        type: 'log',
        range: 'width',
        domain: { data: 'plotData', field: 'rank' },
      },
      {
        name: 'yscale',
        type: 'log',
        nice: true,
        range: 'height',
        domain: { data: 'plotData', field: 'u' },
      },
      {
        name: 'color',
        type: 'ordinal',
        range: ['green', '#f57b42'],
        domain: ['high', 'low'],
      },
    ],

    axes: [
      {
        orient: 'bottom',
        scale: 'xscale',
        tickCount: 5,
        grid: true,
        zindex: 1,
        title: config.axes.xAxisText,
        titleFont: config.fontStyle.font,
        labelFont: config.fontStyle.font,
        titleFontSize: config.axes.titleFontSize,
        labelFontSize: config.axes.labelFontSize,
        offset: config.axes.offset,
        gridOpacity: config.axes.gridOpacity / 20,
        labelAngle: config.axes.xAxisRotateLabels ? 45 : 0,
        labelAlign: config.axes.xAxisRotateLabels ? 'left' : 'center',
      },
      {
        orient: 'left',
        scale: 'yscale',
        grid: true,
        zindex: 1,
        title: config.axes.yAxisText,
        titleFont: config.fontStyle.font,
        labelFont: config.fontStyle.font,
        titleFontSize: config.axes.titleFontSize,
        labelFontSize: config.axes.labelFontSize,
        offset: config.axes.offset,
        gridOpacity: config.axes.gridOpacity / 20,
      },
    ],

    marks: [
      {
        type: 'area',
        from: { data: 'lowerHalfPlotData' },
        clip: true,
        encode: {
          enter: {
            x: { scale: 'xscale', field: 'rank' },
            y: { scale: 'yscale', field: 'u' },
            y2: { scale: 'yscale', value: 1 },
            fill: { value: 'green' },
          },
        },
      },
      {
        type: 'area',
        from: { data: 'higherHalfPlotData' },
        clip: true,
        encode: {
          enter: {
            x: { scale: 'xscale', field: 'rank' },
            y: { scale: 'yscale', field: 'u' },
            y2: { scale: 'yscale', value: 1 },
            fill: { value: '#f57b42' },
          },
        },
      },
      {
        type: 'rule',
        encode: {
          update: {
            x: { scale: 'xscale', value: minCellSizeRank },
            y: 0,
            y2: { field: { group: 'height' } },
            strokeWidth: { value: 2 },
            strokeDash: { value: [8, 4] },
            stroke: { value: 'red' },
          },
        },
      },
    ],
    legends: legend,
    title: {
      text: config.title.text,
      anchor: config.title.anchor,
      font: config.fontStyle.font,
      dx: config.title.dx,
      fontSize: config.title.fontSize,
    },
  };
};

export default generateSpec;
