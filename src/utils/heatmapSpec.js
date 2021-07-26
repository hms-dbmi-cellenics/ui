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
      name: 'trackColorData',
      values: [],
    },
    {
      name: 'trackGroupData',
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
      name: 'yTrack',
      type: 'band',
      domain: {
        data: 'trackOrder',
        field: 'data',
      },
      paddingInner: 0.25,
      paddingOuter: 0.5,
      range: {
        step: -20,
      },
    },

    // Converts a cluster key (e.g. louvain-1) to its name (Cluster 1).
    {
      name: 'clusterKeyToName',
      type: 'ordinal',
      domain: {
        data: 'trackGroupData',
        field: 'key',
      },
      range: {
        data: 'trackGroupData',
        field: 'name',
      },
    },

    // Converts a track key (e.g. louvain) to its name (Louvain clusters).
    {
      name: 'trackKeyToTrackName',
      type: 'ordinal',
      domain: {
        data: 'trackGroupData',
        field: 'track',
      },
      range: {
        data: 'trackGroupData',
        field: 'trackName',
      },
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
    {
      orient: 'left',
      scale: 'yTrack',
      domain: false,
      encode: {
        labels: {
          update: {
            text: {
              signal: 'scale("trackKeyToTrackName", datum.value)',
            },
          },
        },
      },
    },
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
        data: 'trackColorData',
      },
      encode: {
        enter: {
          cursor: 'cell',
          tooltip: { signal: '{"Cell ID": datum.cellId, "Group name": scale("clusterKeyToName", datum.key)}' },
          x: {
            scale: 'x',
            field: 'cellId',
          },
          y: {
            scale: 'yTrack',
            field: 'track',
          },
          width: {
            scale: 'x',
            band: 1,
          },
          height: {
            scale: 'yTrack',
            band: 1,
          },
          opacity: {
            value: 1,
          },
        },
        update: {
          fill: { field: 'color' },
          stroke: { field: 'color' },
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
          cursor: 'cell',
          tooltip: { signal: '{"Cell ID": datum.cellId, "Gene name": datum.gene, "Expression": format(datum.displayExpression, ",.3f") }' },
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
          stroke: {
            scale: 'color',
            field: 'expression',
          },
        },
      },
    },
  ],
};

export default spec;
