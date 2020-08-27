const generateSpec = (config) => {
  let { reverseCbar, masterColour, bounceX } = config;

  if (config.toggleInvert === '#000000') {
    reverseCbar = true;
    masterColour = '#FFFFFF';
  }
  if (config.toggleInvert === '#FFFFFF') {
    reverseCbar = false;
    masterColour = '#000000';
  }

  if (config.toggleAnchor === 'middle') { bounceX = -50; }
  if (config.toggleAnchor === 'start') { bounceX = 50; }

  return {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    description: 'A basic scatter plot example depicting gene expression in the context of UMAP.',
    width: config.width,
    height: config.height,
    autosize: { type: 'fit', resize: true },

    background: config.toggleInvert,
    padding: 5,
    data: [
      {
        name: 'expression',
        values: {},
        transform: [
          { type: 'flatten', fields: ['expression'], index: ['cellId'] },
          { type: 'formula', as: 'expression', expr: config.logEquation },
        ],
      },
      {
        name: 'embedding',
        values: [],
        transform: [
          { type: 'window', ops: ['row_number'], as: ['cellId'] },
          { type: 'formula', as: 'cellId', expr: 'datum.cellId - 1' },
          {
            type: 'lookup', from: 'expression', key: 'cellId', fields: ['cellId'], values: ['expression'], as: ['expression'],
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
        domain: { data: 'embedding', field: '0' },
        range: 'width',
      },
      {
        name: 'y',
        type: 'linear',
        round: true,
        nice: true,
        domain: { data: 'embedding', field: '1' },
        range: 'height',
      },
      {
        name: 'color',
        type: 'linear',
        range: { scheme: config.colGradient },
        domain: { data: 'embedding', field: 'expression' },
        reverse: reverseCbar,
      },
    ],
    axes: [
      {
        scale: 'x',
        grid: true,
        domain: true,
        orient: 'bottom',
        title: { value: config.xaxisText },
        titleFont: { value: config.masterFont },
        labelFont: { value: config.masterFont },
        labelColor: { value: masterColour },
        tickColor: { value: masterColour },
        gridColor: { value: masterColour },
        gridOpacity: { value: (config.transGrid / 20) },
        gridWidth: { value: (config.widthGrid / 20) },
        offset: { value: config.axesOffset },
        titleFontSize: { value: config.axisTitlesize },
        titleColor: { value: masterColour },
        labelFontSize: { value: config.axisTicks },
        domainWidth: { value: config.lineWidth },
      },
      {
        scale: 'y',
        grid: true,
        domain: true,
        orient: 'left',
        titlePadding: 5,
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
        type: 'symbol',
        from: { data: 'embedding' },
        encode: {
          enter: {
            x: { scale: 'x', field: '0' },
            y: { scale: 'y', field: '1' },
            size: { value: config.pointSize },
            stroke: {
              scale: 'color',
              field: 'expression',
            },
            fill: {
              scale: 'color',
              field: 'expression',
            },
            shape: { value: config.pointStyle },
            fillOpacity: { value: config.pointOpa / 10 },
          },
        },
      },

    ],
    legends: config.legend,
    title:
    {
      text: { value: config.titleText },
      color: { value: config.masterColour },
      anchor: { value: config.titleAnchor },
      font: { value: config.masterFont },
      dx: { value: bounceX },
      fontSize: { value: config.titleSize },
    },
  };
};

export {
  // eslint-disable-next-line import/prefer-default-export
  generateSpec,
};
