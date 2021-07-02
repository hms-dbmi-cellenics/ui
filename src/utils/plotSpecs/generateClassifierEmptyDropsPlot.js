const generateSpec = (config, expConfig, plotData) => ({
  $schema: 'https://vega.github.io/schema/vega/v5.json',
  width: config.dimensions.width,
  height: config.dimensions.height,
  autosize: { type: 'fit', resize: true },
  padding: 5,
  autoSize: 'pad',
  data: [
    {
      name: 'plotData',
      values: plotData,
      transform: [
        {
          type: 'filter',
          expr: 'datum.log_u != null && datum.FDR != null',
        },
      ],
    },
    {
      name: 'density',
      source: 'plotData',
      transform: [
        {
          type: 'kde2d',
          size: [{ signal: 'width' }, { signal: 'height' }],
          x: { expr: "scale('x', datum.log_u)" },
          y: { expr: "scale('y', datum.FDR)" },
          bandwidth: [15, 15],
          cellSize: 15,
        },
        {
          type: 'isocontour',
          field: 'grid',
          levels: 6,
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
      domain: { data: 'plotData', field: 'log_u' },
      domainMin: 1.5,
      range: 'width',
    },
    {
      name: 'y',
      type: 'linear',
      round: true,
      nice: true,
      zero: true,
      domain: { data: 'plotData', field: 'FDR' },
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
      labelAngle: config.axes.xAxisRotateLabels ? 45 : 0,
      labelAlign: config.axes.xAxisRotateLabels ? 'left' : 'center',
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
          x: { scale: 'x', field: 'log_u' },
          y: { scale: 'y', field: 'FDR' },
          size: { value: 4 },
          fill: { value: '#ccc' },
        },
      },
    },
    {
      type: 'image',
      from: { data: 'density' },
      encode: {
        update: {
          x: { value: 0 },
          y: { value: 0 },
          width: { signal: 'width' },
          height: { signal: 'height' },
          aspect: { value: false },
        },
      },
      transform: [
        {
          type: 'heatmap',
          field: 'datum.grid',
          resolve: 'independent',
          color: '#1361a8',
        },
      ],
    },
    {
      type: 'rule',
      encode: {
        update: {
          x: { value: 0 },
          x2: { field: { group: 'width' } },
          y: { scale: 'y', value: expConfig.FDR, round: false },
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
    anchor: { value: config.title.anchor },
    font: { value: config.fontStyle.font },
    dx: 10,
    fontSize: { value: config.title.fontSize },
  },
});

export default generateSpec;
