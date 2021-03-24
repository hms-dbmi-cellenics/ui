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
      transform: [
        {
          type: 'filter',
          expr: "datum['log_genes'] != null && datum['log_molecules'] != null",
        },
      ],
    },
  ],

  scales: [
    {
      name: 'x',
      type: 'linear',
      round: true,
      nice: true,
      zero: true,
      domain: [0, 5],
      domainMin: 2,
      range: 'width',
    },
    {
      name: 'y',
      type: 'linear',
      round: true,
      nice: true,
      zero: true,
      domain: { data: 'plotData', field: 'log_genes' },
      domainMin: 2,
      range: 'height',
    },
  ],

  axes: [
    {
      scale: 'x',
      grid: true,
      domain: false,
      orient: 'bottom',
      tickCount: 5,
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
      scale: 'y',
      grid: true,
      domain: false,
      orient: 'left',
      titlePadding: 5,
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
      name: 'marks',
      type: 'symbol',
      from: { data: 'plotData' },
      encode: {
        update: {
          x: { scale: 'x', field: 'log_molecules' },
          y: { scale: 'y', field: 'log_genes' },
          size: { value: 4 },
          strokeWidth: { value: 2 },
          opacity: { value: 0.2 },
          fill: { value: 'red' },
        },
      },
    },
    {
      type: 'rule',
      encode: {
        update: {
          x: { scale: 'x', value: config.lower_cutoff },
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
          x: { scale: 'x', value: config.upper_cutoff },
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
