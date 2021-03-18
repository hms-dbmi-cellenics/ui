const generateSpec = (config, plotData) => ({
  $schema: 'https://vega.github.io/schema/vega/v5.json',
  width: config.dimensions.width,
  height: config.dimensions.height,
  autosize: { type: 'fit', resize: true },
  padding: 5,

  data: [
    {
      name: 'plotData',
      values: plotData,
    },
    {
      name: 'binned',
      source: 'plotData',
      transform: [
        {
          type: 'bin',
          field: 'molecules',
          extent: [2, 5],
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
      ],
    },
  ],

  scales: [
    {
      name: 'xscale',
      type: 'linear',
      range: 'width',
      domain: [2, 5],
      domainMin: 2,

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
  ],

  axes: [
    {
      orient: 'bottom',
      scale: 'xscale',
      grid: true,
      zindex: 1,
      title: { value: config.axes.xAxisText },
      titleFont: { value: config.fontStyle.font },
      labelFont: { value: config.fontStyle.font },
      titleFontSize: { value: config.axes.titleFontSize },
      labelFontSize: { value: config.axes.labelFontSize },
      offset: { value: config.axes.offset },
      gridOpacity: { value: (config.axes.gridOpacity / 20) },
    },
    {
      orient: 'left',
      scale: 'yscale',
      tickCount: 5,
      grid: true,
      zindex: 1,
      title: { value: config.axes.yAxisText },
      titleFont: { value: config.fontStyle.font },
      labelFont: { value: config.fontStyle.font },
      titleFontSize: { value: config.axes.titleFontSize },
      labelFontSize: { value: config.axes.labelFontSize },
      offset: { value: config.axes.offset },
      gridOpacity: { value: (config.axes.gridOpacity / 20) },
    },
  ],

  marks: [
    {
      type: 'rect',
      from: { data: 'binned' },
      encode: {
        update: {
          x: { scale: 'xscale', field: 'bin0' },
          x2: {
            scale: 'xscale',
            field: 'bin1',
          },
          y: { scale: 'yscale', field: 'count' },
          y2: { scale: 'yscale', value: 0 },
          fill: { value: '#f5ce42' },
        },
      },
    },
    {
      type: 'rule',
      encode: {
        update: {
          x: { scale: 'xscale', value: config.lowCutoff },
          y: { value: 0 },
          y2: { field: { group: 'height' } },
          strokeWidth: { value: 2 },
          strokeDash: { value: [8, 4] },
          stroke: { value: 'red' },
        },
      },
    },
    {
      type: 'rule',
      encode: {
        update: {
          x: { scale: 'xscale', value: config.upCutoff },
          y: { value: 0 },
          y2: { field: { group: 'height' } },
          strokeWidth: { value: 2 },
          strokeDash: { value: [8, 4] },
          stroke: { value: 'red' },
        },
      },
    },
  ],
  title:
  {
    text: { value: config.title.text },
    color: { value: config.colour.masterColour },
    anchor: { value: config.title.anchor },
    font: { value: config.fontStyle.font },
    dx: { value: config.title.dx },
    fontSize: { value: config.title.fontSize },
  },
});

export default generateSpec;
