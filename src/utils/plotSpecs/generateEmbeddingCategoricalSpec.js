const generateSpec = (config) => {
  let legend = [];
  if (config.legendEnabled) {
    legend = [
      {
        fill: 'cellSetColors',
        title: 'Cluster Name',
        titleColor: config.masterColour,
        type: 'symbol',
        orient: 'top',
        offset: 40,
        symbolType: 'square',
        symbolSize: { value: 200 },
        encode: {
          labels: {
            update: {
              text: {
                scale: 'cellSetIDToName', field: 'label',
              },
              fill: { value: config.masterColour },
            },

          },
        },
        direction: 'horizontal',
        labelFont: { value: 'sans-serif' },
        titleFont: { value: 'sans-serif' },
      },
    ];
  }
  return {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    description: 'A basic scatter plot example depicting automobile statistics.',
    width: config.width,
    height: config.height,
    autosize: { type: 'fit', resize: true },
    background: config.toggleInvert,
    padding: 5,
    data: [
      {
        name: 'cellSets',
        transform: [
          { type: 'flatten', fields: ['cellIds'], as: ['cellId'] },
        ],
      },
      {
        name: 'embedding',
        transform: [
          { type: 'window', ops: ['row_number'], as: ['cellId'] },
          { type: 'formula', as: 'cellId', expr: 'datum.cellId - 1' },
          {
            type: 'lookup',
            from: 'cellSets',
            key: 'cellId',
            fields: [
              'cellId',
            ],
            values: [
              'cellSetId',
            ],
            as: [
              'cellSetId',
            ],
          },
        ],
      },
      {
        name: 'labelPositions',
        source: 'embedding',
        transform: [
          {
            type: 'aggregate', groupby: ['cellSetId'], fields: ['0', '1'], ops: ['mean', 'mean'], as: ['mean0', 'mean1'],
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
        zero: true,
        domain: { data: 'embedding', field: '1' },
        range: 'height',
      },
      {
        name: 'cellSetColors',
        type: 'ordinal',
        range: { data: 'cellSets', field: 'color' },
        domain: { data: 'cellSets', field: 'cellSetId', sort: true },
      },
      {
        name: 'cellSetIDToName',
        type: 'ordinal',
        range: { data: 'cellSets', field: 'name' },
        domain: { data: 'cellSets', field: 'cellSetId' },
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
            stroke: { scale: 'cellSetColors', field: 'cellSetId' },
            fill: { scale: 'cellSetColors', field: 'cellSetId' },
            shape: { value: config.pointStyle },
            fillOpacity: { value: config.pointOpa / 10 },
          },
        },
      },
      {
        type: 'text',
        from: { data: 'labelPositions' },
        encode: {
          enter: {
            x: { scale: 'x', field: 'mean0' },
            y: { scale: 'y', field: 'mean1' },
            text: { scale: 'cellSetIDToName', field: 'cellSetId' },
            fontSize: { value: config.labelSize },
            strokeWidth: { value: 1.2 },
            fill: { value: config.masterColour },
            fillOpacity: { value: config.labelShow },
            font: { value: config.masterFont },

          },
          transform: [
            { type: 'label', size: ['width', 'height'] }],
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

export {
  // eslint-disable-next-line import/prefer-default-export
  generateSpec,
};
