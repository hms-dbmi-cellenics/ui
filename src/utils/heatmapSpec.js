const spec = {
  $schema: 'https://vega.github.io/schema/vega/v5.json',
  data: [
    {
      name: 'cellOrder',
      values: [],
      copy: true,
    },
    {
      name: 'geneOrder',
      values: [],
      copy: true,
    },
    {
      name: 'trackOrder',
      values: [],
    },
    {
      name: 'heatmapData',
      values: [],
    },
    {
      name: 'trackColors',
      values: [],
    },
  ],
  signals: [
    {
      name: 'mouseOver',
      on: [
        { events: 'rect:mouseover{250}', encode: 'mouseOver' },
      ],
      react: false,
    },
    {
      name: 'hoveroverembedding',
      bind: {
        input: 'text',
        id: 'cellNameInput',
        element: '#heatmapHoverBox',
      },

    },
    {
      name: 'hoveroverembeddingGene',
      bind: {
        input: 'text',
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
        data: 'cellOrder',
        field: 'data',
      },
      range: 'width',
    },
    {
      name: 'y',
      type: 'band',
      domain: {
        fields: [
          {
            data: 'trackOrder',
            field: 'data',
          },
          {
            data: 'geneOrder',
            field: 'data',
          },
        ],
      },
      range: 'height',
    },
    {
      name: 'color',
      type: 'linear',
      range: {
        scheme: 'viridis',
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
    // Enable for debugging.
    // {
    //   orient: 'bottom',
    //   scale: 'x',
    //   domain: false,
    //   title: 'Cells',
    // },
    // {
    //   orient: 'left',
    //   scale: 'y',
    //   domain: false,
    //   title: 'Genes',
    // },
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
        data: 'trackColors',
      },
      encode: {
        enter: {
          cursor: { value: 'cell' },
          tooltip: { signal: '{"Cell ID": datum.cellId, "Group name": datum.name}' },
          x: {
            scale: 'x',
            field: 'cellId',
          },
          y: {
            signal: 'scale("y", datum.track) - bandwidth("y") * 1.5',
          },
          width: {
            scale: 'x',
            band: 1,
          },
          height: {
            scale: 'y',
            band: 1,
          },
          opacity: {
            value: 1,
          },
        },
        update: {
          fill: { field: 'color' },
        },
      },
    },
    {
      type: 'rect',
      from: {
        data: 'heatmapData',
      },
      encode: {
        enter: {
          cursor: { value: 'cell' },
          tooltip: { signal: '{"Cell ID": datum.cellId, "Gene name": datum.gene, "Expression": format(datum.expression, ",.5f") }' },
          x: {
            scale: 'x',
            field: 'cellId',
          },
          y: {
            scale: 'y',
            field: 'gene',
          },
          width: {
            scale: 'x',
            band: 1,
          },
          height: {
            scale: 'y',
            band: 1,
          },
          opacity: {
            value: 1,
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
  ],
};

export default spec;
