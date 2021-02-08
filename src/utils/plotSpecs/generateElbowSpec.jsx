const generateSpec = (config) => ({
  width: config.width,
  height: config.height,
  autosize: { type: 'none', resize: true, contains: 'padding' },
  padding: 5,

  signals: config.signals,

  data: [
    {
      name: 'plotData',
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
      title: { value: config.xAxisText },
      titleFont: { value: config.masterFont },
      labelFont: { value: config.masterFont },
      titleFontSize: { value: config.axisTitlesize },
      labelFontSize: { value: config.axisTicks },
      offset: { value: config.axisOffset },
      gridOpacity: { value: (config.transGrid / 20) },
    },
    {
      orient: 'left',
      scale: 'y',
      grid: true,
      format: '%',
      zindex: 1,
      title: { value: config.yAxisText },
      titleFont: { value: config.masterFont },
      labelFont: { value: config.masterFont },
      titleFontSize: { value: config.axisTitlesize },
      labelFontSize: { value: config.axisTicks },
      offset: { value: config.axisOffset },
      gridOpacity: { value: (config.transGrid / 20) },
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
          x: { scale: 'x', value: config.minProbability, round: true },
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
    text: { value: config.titleText },
    anchor: { value: config.titleAnchor },
    font: { value: config.masterFont },
    dx: { value: config.titleDx },
    fontSize: { value: config.titleSize },
  },
});

export {
  // eslint-disable-next-line import/prefer-default-export
  generateSpec,
};

export default generateSpec;
