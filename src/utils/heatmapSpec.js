const spec = {
  $schema: 'https://vega.github.io/schema/vega/v5.json',
  description: 'A heatmap showing average daily temperatures in Seattle for each hour of the day.',
  data: [
    {
      name: 'cellNames',
      values: [],
      type: 'json',
      copy: true,
      transform: [
        {
          type: 'identifier',
          as: 'cellIndex',
        },
        {
          type: 'formula',
          as: 'cellIndex',
          expr: 'datum.cellIndex-1',
        },
      ],
    },
    {
      name: 'heatmapData',
      values: [],
      copy: true,
      transform: [
        {
          type: 'flatten',
          fields: ['expression'],
          index: 'cellIndex',
        },
        {
          type: 'lookup',
          from: 'cellNames',
          key: 'cellIndex',
          fields: ['cellIndex'],
          values: ['data'],
          as: ['cellName'],
        },
      ],
    },
  ],
  signals: [
    {
      name: 'mouseover',
      on: [
        { events: '*:mouseover', encode: 'select' },
      ],
    },
  ],
  scales: [
    {
      name: 'x',
      type: 'band',
      domain: {
        data: 'cellNames',
        field: 'data',
      },
      range: 'width',
    },
    {
      name: 'y',
      type: 'band',
      domain: {
        data: 'heatmapData',
        field: 'geneName',
      },
      range: 'height',
    },
    {
      name: 'color',
      type: 'linear',
      range: {
        scheme: 'Viridis',
      },
      domain: {
        data: 'heatmapData',
        field: 'expression',
      },
      zero: false,
      nice: true,
    },
  ],
  axes: [
  ],
  legends: [
    {
      fill: 'color',
      type: 'gradient',
      gradientLength: {
        signal: 'height',
      },
    },
  ],
  marks: [
    {
      type: 'rect',
      from: {
        data: 'heatmapData',
      },
      encode: {
        enter: {
          x: {
            scale: 'x',
            field: 'cellName',
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
        hover: {
          cursor: {
            value: 'pointer',
          },
        },
      },
    },
  ],
};

export default spec;
