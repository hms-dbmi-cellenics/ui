const generateSpec = (config) => {
  let legend = [];
  if (config.legendEnabled) {
    legend = [
      {
        fill: 'color',
        title: 'Cell Set',
        titleColor: config.masterColour,
        type: 'symbol',
        orient: config.legendPosition,
        offset: 40,
        symbolType: 'square',
        symbolSize: { value: 200 },
        encode: {
          labels: {
            update: {
              text: {
                scale: 'c', field: 'label',
              },
              fill: { value: config.masterColour },
            },
          },
        },
        direction: 'horizontal',
        labelFont: { value: config.masterFont },
        titleFont: { value: config.masterFont },
      },
    ];
  }
  return {
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
        name: 'c',
        type: 'ordinal',
        range: { data: 'data', field: 'c' },
        domain: { data: 'data', field: 'c' },
      },
      {
        name: 'color',
        type: 'ordinal',
        range: { data: 'data', field: 'color' },
        domain: { data: 'data', field: 'c', sort: true },
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
        },
      },
    ],
    legends: legend,
    title:
    {
      text: { value: config.titleText },
      color: { value: config.masterColour },
      anchor: { value: config.titleAnchor },
      font: { value: config.masterFont },
      dx: 10,
      fontSize: { value: config.titleSize },
    },
  };
};

export default generateSpec;
