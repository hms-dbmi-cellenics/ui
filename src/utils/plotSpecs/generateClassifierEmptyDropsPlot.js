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
      title: config.axes.xAxisText,
      titleFont: config.fontStyle.font,
      labelFont: config.fontStyle.font,
      titleFontSize: config.axes.titleFontSize,
      labelFontSize: config.axes.labelFontSize,
      offset: config.axes.offset,
      gridOpacity: (config.axes.gridOpacity / 20),
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
      title: config.axes.yAxisText,
      titleFont: config.fontStyle.font,
      labelFont: config.fontStyle.font,
      titleFontSize: config.axes.titleFontSize,
      labelFontSize: config.axes.labelFontSize,
      offset: config.axes.offset,
      gridOpacity: (config.axes.gridOpacity / 20),
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
          size: 4,
          fill: '#ccc',
        },
      },
    },
    {
      type: 'image',
      from: { data: 'density' },
      encode: {
        update: {
          x: 0,
          y: 0,
          width: { signal: 'width' },
          height: { signal: 'height' },
          aspect: false,
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
          x: 0,
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
    text: config.title.text,
    anchor: config.title.anchor,
    font: config.fontStyle.font,
    dx: 10,
    fontSize: config.title.fontSize,
  },
});

export default generateSpec;
