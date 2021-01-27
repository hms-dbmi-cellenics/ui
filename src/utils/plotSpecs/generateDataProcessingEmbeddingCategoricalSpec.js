// eslint-disable-next-line no-bitwise
const invertHex = (hex) => (Number(`0x1${hex}`) ^ 0xFFFFFF).toString(16).substr(1).toUpperCase();

const generateSpec = (config) => {
  let legend = [];
  if (config.legendEnabled) {
    legend = [
      {
        fill: 'cellSetColors',
        title: 'Cluster Name',
        titleColor: config.text.color,
        type: 'symbol',
        orient: config.legendPosition,
        offset: 40,
        symbolType: 'square',
        symbolSize: { value: 200 },
        encode: {
          labels: {
            update: {
              text: {
                scale: 'cellSetIDToName', field: 'label',
              },
              fill: { value: config.text.color },
            },

          },
        },
        direction: 'horizontal',
        labelFont: { value: config.text.font },
        titleFont: { value: config.text.font },
      },
    ];
  }

  return {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    description: 'A basic scatter plot example depicting automobile statistics.',
    width: config.dimensions.width,
    height: config.dimensions.height,
    autosize: { type: 'fit', resize: true },
    background: config.colorInverted ? '#000000' : '#ffffff',
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
        reverse: true,
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
        title: { value: config.axes.xText },
        titleFont: { value: config.text.font },
        labelFont: { value: config.text.font },
        labelColor: {
          value: !config.colorInverted
            ? config.text.color : invertHex(config.text.color),
        },
        tickColor: {
          value: !config.colorInverted
            ? config.text.color : invertHex(config.text.color),
        },
        gridColor: {
          value: !config.colorInverted
            ? config.text.color : invertHex(config.text.color),
        },
        gridOpacity: { value: (config.axes.gridOpacity / 20) },
        gridWidth: { value: (config.axes.gridWidth / 20) },
        offset: { value: config.axes.offset },
        titleFontSize: { value: config.axes.titleSize },
        titleColor: {
          value: !config.colorInverted
            ? config.text.color : invertHex(config.text.color),
        },
        labelFontSize: { value: config.axes.fontSize },
        domainWidth: { value: config.axes.lineWidth },
      },
      {
        scale: 'y',
        grid: true,
        domain: true,
        orient: 'left',
        titlePadding: 5,
        title: { value: config.axes.xText },
        titleFont: { value: config.text.font },
        labelFont: { value: config.text.font },
        labelColor: {
          value:
            !config.colorInverted
              ? config.text.color : invertHex(config.text.color),
        },
        tickColor: {
          value: !config.colorInverted
            ? config.text.color : invertHex(config.text.color),
        },
        gridColor: {
          value: !config.colorInverted
            ? config.text.color : invertHex(config.text.color),
        },
        gridOpacity: { value: (config.axes.gridOpacity / 20) },
        gridWidth: { value: (config.axes.gridWidth / 20) },
        offset: { value: config.axes.offset },
        titleFontSize: { value: config.axes.titleSize },
        titleColor: {
          value: !config.colorInverted
            ? config.text.color : invertHex(config.text.color),
        },
        labelFontSize: { value: config.axes.fontSize },
        domainWidth: { value: config.axes.lineWidth },
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
            size: { value: config.markers.size },
            stroke: { scale: 'cellSetColors', field: 'cellSetId' },
            fill: { scale: 'cellSetColors', field: 'cellSetId' },
            shape: { value: config.markers.shape },
            fillOpacity: { value: config.markers.opacity / 10 },
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
            fontSize: { value: config.labels.size },
            strokeWidth: { value: 1.2 },
            fill: {
              value:
                !config.colorInverted
                  ? config.text.color : invertHex(config.text.color),
            },
            fillOpacity: { value: !!config.labels.show },
            font: { value: config.text.font },

          },
          transform: [
            { type: 'label', size: ['width', 'height'] }],
        },
      },
    ],
    legends: legend,
    title:
    {
      text: { value: config.title.text },
      color: { value: !config.colorInverted ? config.text.color : invertHex(config.text.color) },
      anchor: { value: config.title.anchor },
      font: { value: config.text.font },
      dx: 10,
      fontSize: { value: config.title.size },
    },
  };
};

export default generateSpec;
