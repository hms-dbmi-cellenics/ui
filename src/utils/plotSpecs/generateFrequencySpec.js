// import _ from 'lodash';

const generateSpec = (config) => ({
  $schema: 'https://vega.github.io/schema/vega/v5.json',
  width: config.width,
  height: config.height,
  autosize: { type: 'fit', resize: true },
  background: config.toggleInvert,
  padding: 5,

  data: [
    {
      name: 'data',
      transform: [
        {
          type: 'stack',
          groupby: ['x'],
          sort: { field: 'c' },
          field: 'y',
        },
      ],
    },
  ],

  scales: [
    {
      name: 'x',
      type: 'band',
      range: 'width',
      domain: { data: 'data', field: 'x' },
    },
    {
      name: 'y',
      type: 'linear',
      range: 'height',
      nice: true,
      zero: true,
      domain: { data: 'data', field: 'y1' },
    },
    {
      name: 'color',
      type: 'ordinal',
      range: 'category',
      domain: { data: 'data', field: 'c' },
    },
  ],

  axes: [
    {
      orient: 'bottom',
      scale: 'x',
      zindex: 1,
      title: { value: config.xaxisText },
      titleFont: { value: config.masterFont },
      labelFont: { value: config.masterFont },
      labelColor: { value: config.masterColour },
      tickColor: { value: config.masterColour },
      gridColor: { value: config.masterColour },
      gridOpacity: { value: (config.transGrid / 20) },
      gridWidth: { value: (config.widthGrid / 20) },
      offset: { value: config.axesOffset },
      titleFontSize: { value: config.axisTitlesize },
      titleColor: { value: config.masterColour },
      labelFontSize: { value: config.axisTicks },
      domainWidth: { value: config.lineWidth },
    },
    {
      orient: 'left',
      scale: 'y',
      zindex: 1,
      gridColor: { value: config.masterColour },
      gridOpacity: { value: (config.transGrid / 20) },
      gridWidth: { value: (config.widthGrid / 20) },
      tickColor: { value: config.masterColour },
      offset: { value: config.axesOffset },
      title: { value: config.yaxisText },
      titleFont: { value: config.masterFont },
      labelFont: { value: config.masterFont },
      labelColor: { value: config.masterColour },
      titleFontSize: { value: config.axisTitlesize },
      titleColor: { value: config.masterColour },
      labelFontSize: { value: config.axisTicks },
      domainWidth: { value: config.lineWidth },
    },
  ],

  marks: [
    {
      type: 'rect',
      from: { data: 'data' },
      encode: {
        enter: {
          x: { scale: 'x', field: 'x' },
          width: { scale: 'x', band: 1, offset: -1 },
          y: { scale: 'y', field: 'y0' },
          y2: { scale: 'y', field: 'y1' },
          fill: { scale: 'color', field: 'c' },
        },
        update: {
          fillOpacity: { value: 1 },
        },
        hover: {
          fillOpacity: { value: 0.5 },
        },
      },
    },
  ],
});

export default generateSpec;
