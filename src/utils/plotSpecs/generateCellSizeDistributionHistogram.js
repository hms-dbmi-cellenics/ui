const generateSpec = (config, plotData, highestUmi) => {
  let legend = null;

  const coloringExpressionPlot = `(datum.bin1 < ${config.minCellSize}) ? 'low' : 'high'`;

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
      },
      {
        name: 'binned',
        source: 'plotData',
        transform: [
          {
            type: 'bin',
            field: 'u',
            extent: [0, highestUmi],
            step: config.binStep,
            nice: false,
          },
          {
            type: 'aggregate',
            key: 'bin0',
            groupby: ['bin0', 'bin1'],
            fields: ['bin0'],
            ops: ['count'],
            as: ['count'],
          },
          {
            type: 'formula',
            as: 'color',
            expr: coloringExpressionPlot,
          },
        ],
      },
    ],

    scales: [
      {
        name: 'xscale',
        type: 'linear',
        range: 'width',
        domain: [1000, highestUmi],
      },
      {
        name: 'yscale',
        type: 'linear',
        range: 'height',
        round: true,
        domain: { data: 'binned', field: 'count' },
        zero: true,
        nice: true,
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
        type: 'rect',
        from: { data: 'binned' },
        encode: {
          enter: {
            x: { scale: 'xscale', field: 'bin0' },
            x2: {
              scale: 'xscale',
              field: 'bin1',
            },
            y: { scale: 'yscale', field: 'count' },
            y2: { scale: 'yscale', value: 0 },
            stroke: { value: 'black' },
            strokeWidth: { value: 0.5 },
            fill: {
              scale: 'color',
              field: 'color',
            },
          },
        },
      },
      {
        type: 'rule',
        encode: {
          update: {
            x: { scale: 'xscale', value: config.minCellSize },
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
