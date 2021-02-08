const generateSpec = (config, groupName) => {
  let legend = [];
  if (config.legend.position === 'horizontal') {
    legend = [
      {
        fill: 'color',
        type: 'gradient',
        orient: 'bottom',
        direction: 'horizontal',
        title: ['Intensity'],
        labelFont: { value: config.fontStyle.font },
        titleFont: { value: config.fontStyle.font },
        gradientLength: {
          signal: 'width',
        },
      },
      {
        fill: 'cellSetColors',
        title: groupName,
        type: 'symbol',
        orient: 'top',
        offset: 40,
        symbolType: 'square',
        symbolSize: { value: 200 },
        encode: {
          labels: {
            update: {
              text: { scale: 'cellSetIDToName', field: 'label' },
            },
          },
        },
        direction: 'horizontal',
        labelFont: { value: config.fontStyle.font },
        titleFont: { value: config.fontStyle.font },
      }];
  }
  if (config.legend.position === 'vertical') {
    legend = [
      {
        fill: 'color',
        type: 'gradient',
        title: ['Intensity'],
        labelFont: { value: config.fontStyle.font },
        titleFont: { value: config.fontStyle.font },
        gradientLength: {
          signal: 'height / 3',
        },
      },
      {
        fill: 'cellSetColors',
        title: 'Cluster ID',
        type: 'symbol',
        orient: 'right',
        symbolType: 'square',
        symbolSize: { value: 200 },
        encode: {
          labels: {
            update: {
              text: { scale: 'cellSetIDToName', field: 'label' },
            },
          },
        },
        direction: 'vertical',
        labelFont: { value: config.fontStyle.font },
        titleFont: { value: config.fontStyle.font },
        labels: {
          text: 'asdsa',
        },
      }];
  }
  if (!config.legend.enabled) {
    legend = null;
  }

  return {
    $schema: 'http//s:vega.github.io/schema/vega/v5.json',
    width: config.dimensions.width,
    height: config.dimensions.height,
    autosize: { type: 'fit', resize: true },

    data: [
      {
        name: 'cellSets',
        transform: [
          {
            type: 'flatten',
            fields: [
              'cellIds',
            ],
            as: [
              'cellId',
            ],
          },
        ],
      },
      {
        name: 'expression',
        transform: [
          {
            type: 'flatten',
            fields: [
              'expression',
            ],
            index: 'cellId',
          },
        ],
      },
    ],

    scales: [
      {
        name: 'x',
        type: 'band',
        domain: {
          data: 'cellSets',
          field: 'cellId',
        },
        range: 'width',
      },
      {
        name: 'y',
        type: 'band',
        domain: {
          data: 'expression',
          field: 'geneName',
        },
        range: 'height',
      },
      {
        name: 'color',
        type: 'linear',
        range: {
          scheme: config.colour.gradient,
        },
        domain: {
          data: 'expression',
          field: 'expression',
        },
        zero: false,
        nice: true,
      },
      {
        name: 'cellSetColors',
        type: 'ordinal',
        range: {
          data: 'cellSets',
          field: 'color',
        },
        domain: {
          data: 'cellSets',
          field: 'key',
          sort: true,
        },
      },
      {
        name: 'cellSetIDToName',
        type: 'ordinal',
        range: {
          data: 'cellSets',
          field: 'name',
        },
        domain: {
          data: 'cellSets',
          field: 'key',
        },
      },
    ],

    axes: [
      {
        from: { data: 'expression' },
        orient: 'left',
        scale: 'y',
        labelColor: config.label.colour,
        domain: false,
        // title: 'Gene',
        labelFont: { value: config.fontStyle.font },
        titleFont: { value: config.fontStyle.font },
      },
    ],

    legends: legend,

    marks: [
      {
        type: 'rect',
        from: {
          data: 'expression',
        },
        encode: {
          enter: {
            x: {
              scale: 'x',
              field: 'cellId',
            },
            y: {
              scale: 'y',
              field: 'geneName',
            },
            width: {
              scale: 'x',
              band: 1,
            },
            height: {
              scale: 'y',
              band: 1,
            },
          },
          update: {
            fill: {
              scale: 'color',
              field: 'expression',
            },
          },
        },
      },
      {
        type: 'rect',
        from: {
          data: 'cellSets',
        },
        encode: {
          enter: {
            x: {
              scale: 'x',
              field: 'cellId',
            },
            y: { value: -30 },
            width: {
              scale: 'x',
              band: 1,
            },
            height: {
              value: 20,
            },
          },
          update: {
            fill: {
              scale: 'cellSetColors',
              field: 'key',
              opacity: { value: 1 },
            },
            stroke: {
              scale: 'cellSetColors',
              field: 'key',
              opacity: { value: 1 },
            },
          },
        },
      },
    ],
    title:
    {
      text: { value: config.title.text },
      color: { value: config.colour.masterColour },
      anchor: { value: config.title.anchor },
      font: { value: config.fontStyle.font },
      dx: { value: config.title.dx },
      fontSize: { value: config.title.fontSize },
    },
  };
};

const generateData = () => { };

export { generateSpec, generateData };
