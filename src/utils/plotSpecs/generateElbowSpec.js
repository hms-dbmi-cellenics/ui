const generateSpec = (config, plotData, numPCs) => ({
  width: config.dimensions.width,
  height: config.dimensions.height,
  autosize: { type: 'fit', resize: true },
  padding: 5,

  signals: config.signals,

  data: [
    {
      name: 'plotData',
      values: plotData,
      transform: [
        {
          type: 'formula',
          as: 'percent',
          expr: 'datum.percentVariance',
        },
      ],
    },
  ],

  scales: [
    {
      name: 'x',
      type: 'linear',
      range: 'width',
      domain: { data: 'plotData', field: 'PC' },
    },
    {
      name: 'y',
      type: 'linear',
      range: 'height',
      nice: true,
      zero: true,
      domain: { data: 'plotData', field: 'percent' },
    },
  ],

  axes: [
    {
      orient: 'bottom',
      scale: 'x',
      grid: true,
      tickCount: 15,
      zindex: 1,
      title: { value: config.axes.xAxisText },
      titleFont: { value: config.axes.titleFont },
      labelFont: { value: config.axes.labelFont },
      titleFontSize: { value: config.axes.titleFontSize },
      labelFontSize: { value: config.axes.labelFontSize },
      offset: { value: config.axes.offset },
      gridOpacity: { value: (config.axes.gridOpacity / 20) },
      labelAngle: config.axes.xAxisRotateLabels ? 45 : 0,
      labelAlign: config.axes.xAxisRotateLabels ? 'left' : 'center',
    },
    {
      orient: 'left',
      scale: 'y',
      grid: true,
      tickCount: 15,
      format: '%',
      zindex: 1,
      title: { value: config.axes.yAxisText },
      titleFont: { value: config.axes.titleFont },
      labelFont: { value: config.axes.labelFont },
      titleFontSize: { value: config.axes.titleFontSize },
      labelFontSize: { value: config.axes.labelFontSize },
      offset: { value: config.axes.offset },
      gridOpacity: { value: (config.axes.gridOpacity / 20) },
    },
  ],

  marks: [
    {
      type: 'line',
      from: { data: 'plotData' },
      encode: {
        enter: {
          x: { scale: 'x', field: 'PC' },
          y: { scale: 'y', field: 'percent' },
          strokeWidth: { value: 2 },
        },
        update: {
          interpolate: { signal: 'interpolate' },
          strokeOpacity: { value: 1 },
        },
        hover: {
          strokeOpacity: { value: 0.5 },
        },
      },
    },
    {
      type: 'rule',
      encode: {
        update: {
          x: { scale: 'x', value: numPCs, round: true },
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
      anchor: { value: config.title.anchor },
      font: { value: config.title.font },
      fontSize: { value: config.title.fontSize },
      dx: { value: config.title.dx },
    },
});

const generateData = () => { };

export { generateSpec, generateData };
