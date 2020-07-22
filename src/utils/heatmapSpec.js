const spec = {
  $schema: 'https://vega.github.io/schema/vega/v5.json',
  description: 'A heatmap showing expression per cell (columns) per gene (rows).',
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
      name: 'mouseOver',
      on: [
        { events: 'rect:mouseover{50}', encode: 'mouseOver' },
      ],
    },
    {
      name: 'hoveroverembedding',
      bind: {
        id: 'cellNameInput',
        element: '#heatmapHoverBox',
      },
    },
    {
      name: 'hoveroverembeddingGene',
      bind: {
        id: 'geneNameInput',
        element: '#heatmapHoverBox',
      },
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
      },
    },
    {
      type: 'rule',
      encode: {
        enter: {
          strokeWidth: {
            scale: 'x',
            band: 2,
          },
          stroke: {
            value: '#000000',
          },
          opacity: {
            value: 1,
          },
          y: { value: 0 },
          y2: { signal: 'height' },
        },
        update: {
          x: {
            scale: 'x',
            signal: 'hoveroverembedding',
            offset: { scale: 'x', band: 0.5 },
          },
          x2: {
            scale: 'x',
            signal: 'hoveroverembedding',
            offset: { scale: 'x', band: 0.5 },
          },
        },
      },
    },
    {
      type: 'rule',
      encode: {
        enter: {
          strokeWidth: {
            scale: 'x',
            band: 2,
          },
          stroke: {
            value: '#000000',
          },
          opacity: {
            value: 1,
          },
          x: { value: 0 },
          x2: { signal: 'width' },
        },
        update: {
          y: {
            scale: 'y',
            signal: 'hoveroverembeddingGene',
            offset: { scale: 'y', band: 0.5 },
          },
          y2: {
            scale: 'y',
            signal: 'hoveroverembeddingGene',
            offset: { scale: 'y', band: 0.5 },
          },
        },
      },
    },
  ],
};

export default spec;
