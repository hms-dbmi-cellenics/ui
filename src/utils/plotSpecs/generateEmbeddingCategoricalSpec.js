/* eslint-disable no-param-reassign */
const generateSpec = (config) => {
  let legend = [];
  if (config.legend.enabled) {
    legend = [
      {
        fill: 'cellSetColors',
        title: 'Cluster Name',
        titleColor: config.colour.masterColour,
        type: 'symbol',
        orient: config.legend.position,
        offset: 40,
        symbolType: 'square',
        symbolSize: { value: 200 },
        encode: {
          labels: {
            update: {
              text: {
                scale: 'cellSetIDToName', field: 'label',
              },
              fill: { value: config.colour.masterColour },
            },

          },
        },
        direction: 'horizontal',
        labelFont: { value: config.fontStyle.font },
        titleFont: { value: config.fontStyle.font },
      },
    ];
  }
  return {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    description: 'A basic scatter plot example depicting automobile statistics.',
    width: config.dimensions.width,
    height: config.dimensions.height,
    autosize: { type: 'fit', resize: true },
    background: config.colour.toggleInvert,
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
        title: { value: config.axes.xAxisText },
        titleFont: { value: config.fontStyle.font },
        labelFont: { value: config.fontStyle.font },
        labelColor: { value: config.colour.masterColour },
        tickColor: { value: config.colour.masterColour },
        gridColor: { value: config.colour.masterColour },
        gridOpacity: { value: (config.axes.gridOpacity / 20) },
        gridWidth: { value: (config.axes.gridWidth / 20) },
        offset: { value: config.axes.offset },
        titleFontSize: { value: config.axes.titleFontSize },
        titleColor: { value: config.colour.masterColour },
        labelFontSize: { value: config.axes.labelFontSize },
        domainWidth: { value: config.axes.domainWidth },
      },
      {
        scale: 'y',
        grid: true,
        domain: true,
        orient: 'left',
        titlePadding: 5,
        gridColor: { value: config.colour.masterColour },
        gridOpacity: { value: (config.axes.gridOpacity / 20) },
        gridWidth: { value: (config.axes.gridWidth / 20) },
        tickColor: { value: config.colour.masterColour },
        offset: { value: config.axes.offset },
        title: { value: config.axes.yAxisText },
        titleFont: { value: config.fontStyle.font },
        labelFont: { value: config.fontStyle.font },
        labelColor: { value: config.colour.masterColour },
        titleFontSize: { value: config.axes.titleFontSize },
        titleColor: { value: config.colour.masterColour },
        labelFontSize: { value: config.axes.labelFontSize },
        domainWidth: { value: config.axes.domainWidth },
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
            size: { value: config.marker.size },
            stroke: { scale: 'cellSetColors', field: 'cellSetId' },
            fill: { scale: 'cellSetColors', field: 'cellSetId' },
            shape: { value: config.marker.shape },
            fillOpacity: { value: config.marker.opacity / 10 },
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
            fontSize: { value: config.label.size },
            strokeWidth: { value: 1.2 },
            fill: { value: config.colour.masterColour },
            fillOpacity: { value: config.label.enabled },
            font: { value: config.fontStyle.font },

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
      color: { value: config.colour.masterColour },
      anchor: { value: config.anchor },
      font: { value: config.fontStyle.font },
      dx: 10,
      fontSize: { value: config.title.fontSize },
    },
  };
};

const generateData = (spec, cellSets, selectedCellSet, embeddingData) => {
  let newCellSets = cellSets.hierarchy.find(
    (rootNode) => rootNode.key === selectedCellSet,
  )?.children || [];

  // Build up the data source based on the properties. Note that the child nodes
  // in the hierarchy are /objects/ with a `key` property, hence the destructuring
  // in the function.
  newCellSets = newCellSets.map(({ key }) => ({
    cellSetId: key,
    ...cellSets.properties[key],
    cellIds: Array.from(cellSets.properties[key].cellIds),
  }));

  spec.data.forEach((s) => {
    if (s.name === 'cellSets') {
      s.values = newCellSets;
    } else if (s.name === 'embedding') {
      s.values = embeddingData;
    }
  });

  return spec;
};

export {
  generateSpec,
  generateData,
};
