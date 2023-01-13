const generateSpec = (config, plotData) => {
  let legend = null;
  const generateStatus = `(datum.bin1 <= ${config.probabilityThreshold}) ? 'low score' : 'high score'`;

  const xScaleDomain = config.axesRanges.xAxisAuto
    ? [0, 1]
    : [Math.max(config.axesRanges.xMin, 0), Math.min(config.axesRanges.xMax, 1)];

  const yScaleDomain = config.axesRanges.yAxisAuto
    ? { data: 'binned', field: 'count' }
    : [config.axesRanges.yMin, config.axesRanges.yMax];

  legend = !config.legend.enabled ? {} : [
    {
      fill: 'color',
      orient: config.legend.position,
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
            field: 'doubletP',
            extent: [0, 1],
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
            as: 'count',
            expr: 'datum.count/1000',
          },
          {
            type: 'formula',
            as: 'status',
            expr: generateStatus,
          },
        ],
      },
    ],

    scales: [
      {
        name: 'xscale',
        type: 'linear',
        range: 'width',
        domain: xScaleDomain,
        zero: false,
      },
      {
        name: 'yscale',
        type: 'linear',
        range: 'height',
        domain: yScaleDomain,
        nice: true,
        zero: false,
      },
      {
        name: 'color',
        type: 'ordinal',
        range: ['green', 'blue'],
        domain: ['low score', 'high score'],
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
        tickCount: 5,
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
        clip: true,
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
            fill: {
              scale: 'color',
              field: 'status',
            },
          },
        },
      },
      {
        type: 'rect',
        clip: true,
        from: { data: 'binned' },
        encode: {
          update: {
            x: { scale: 'xscale', field: 'bin0' },
            width: { value: 1 },
            y: { value: 25, offset: { signal: 'height' } },
            height: { value: 5 },
            fillOpacity: { value: 0.4 },
            fill: {
              scale: 'color',
              field: 'status',
            },
          },
        },
      },
      {
        type: 'rule',
        clip: true,
        encode: {
          update: {
            x: { scale: 'xscale', value: config.probabilityThreshold },
            y: { value: 0 },
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
