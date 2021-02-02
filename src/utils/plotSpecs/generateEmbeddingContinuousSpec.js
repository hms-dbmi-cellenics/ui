const generateSpec = (config) => {
  let legend = [];

  if (config.legend.enabled) {
    legend = [
      {
        fill: 'color',
        type: 'gradient',
        orient: config.legend.position,
        title: config.shownGene,
        gradientLength: 100,
        labelColor: { value: config.colour.masterColour },
        titleColor: { value: config.colour.masterColour },
        labels: {
          interactive: true,
          update: {
            fontSize: { value: 12 },
            fill: { value: config.colour.masterColour },
          },

        },
      }];
  }
  return {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    description: 'A basic scatter plot example depicting gene expression in the context of UMAP.',
    width: config.dimensions.width,
    height: config.dimensions.height,
    autosize: { type: 'fit', resize: true },

    background: config.colour.toggleInvert,
    padding: 5,
    data: [
      {
        name: 'expression',
        transform: [
          { type: 'flatten', fields: ['expression'], index: ['cellId'] },
          { type: 'formula', as: 'expression', expr: config.logEquation },
        ],
      },
      {
        name: 'embedding',
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
        range: { scheme: config.colour.gradient },
        domain: { data: 'embedding', field: 'expression' },
        reverse: config.colour.reverseCbar,
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
        gridOpacity: { value: (config.transGrid / 20) },
        gridWidth: { value: (config.widthGrid / 20) },
        offset: { value: config.axes.offset },
        titleFontSize: { value: config.axes.labelSize },
        titleColor: { value: config.colour.masterColour },
        labelFontSize: { value: config.axes.labelSize },
        domainWidth: { value: config.lineWidth },
      },
      {
        scale: 'y',
        grid: true,
        domain: true,
        orient: 'left',
        titlePadding: 5,
        gridColor: { value: config.colour.masterColour },
        gridOpacity: { value: (config.transGrid / 20) },
        gridWidth: { value: (config.widthGrid / 20) },
        tickColor: { value: config.colour.masterColour },
        offset: { value: config.axes.offset },
        title: { value: config.axes.yAxisText },
        titleFont: { value: config.fontStyle.font },
        labelFont: { value: config.fontStyle.font },
        labelColor: { value: config.colour.masterColour },
        titleFontSize: { value: config.axes.labelSize },
        titleColor: { value: config.colour.masterColour },
        labelFontSize: { value: config.axes.labelSize },
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
            size: { value: config.marker.size },
            stroke: {
              scale: 'color',
              field: 'expression',
            },
            fill: {
              scale: 'color',
              field: 'expression',
            },
            shape: { value: config.marker.shape },
            fillOpacity: { value: config.marker.opacity / 10 },
          },
        },
      },

    ],
    legends: legend,
    title:
    {
      text: { value: config.title.text },
      color: { value: config.colour.masterColour },
      anchor: { value: config.title.anchor },
      font: { value: config.fontStyle.font },
      dx: { value: config.bounceX },
      fontSize: { value: config.title.fontSize },
    },
  };
};

export {
  // eslint-disable-next-line import/prefer-default-export
  generateSpec,
};

export default generateSpec;
