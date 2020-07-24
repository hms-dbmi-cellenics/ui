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
      name: 'heatmapData',
      values: [],
      copy: true,
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
        data: 'geneOrder',
        field: 'data',
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
        data: 'heatmapData',
      },
      encode: {
        enter: {
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
          y: {
            value: 0,
          },
          y2: {
            signal: 'height',
          },
        },
        update: {
          x: {
            scale: 'x',
            signal: 'hoveroverembedding',
            offset: {
              scale: 'x',
              band: 0.5,
            },
          },
          x2: {
            scale: 'x',
            signal: 'hoveroverembedding',
            offset: {
              scale: 'x',
              band: 0.5,
            },
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
          x: {
            value: 0,
          },
          x2: {
            signal: 'width',
          },
        },
        update: {
          y: {
            scale: 'y',
            signal: 'hoveroverembeddingGene',
            offset: {
              scale: 'y',
              band: 0.5,
            },
          },
          y2: {
            scale: 'y',
            signal: 'hoveroverembeddingGene',
            offset: {
              scale: 'y',
              band: 0.5,
            },
          },
        },
      },
    },
  ],
};

export default spec;
