/* eslint-disable no-param-reassign */

const generateSamplePlotSpec = (config) => {
  if (config.toggleInvert === '#000000') {
    config.reverseCbar = true;
    config.masterColour = '#FFFFFF';
    config.legendTextColor = '#FFFFFF';
  }
  if (config.toggleInvert === '#FFFFFF') {
    config.reverseCbar = false;
    config.masterColour = '#000000';
    config.legendTextColor = '#000000';
  }

  if (config.labelsEnabled) {
    config.labelShow = 1;
  } else {
    config.labelShow = 0;
  }

  if (config.legendEnabled) {
    config.legend = [
      {
        title: '',
        titleColor: config.masterColour,
        fill: 'color',
        orient: config.legendPosition,
        rowPadding: 5,
        symbolSize: 200,

        encode: {
          title: {
            update: {
              fontSize: { value: 14 },
            },
          },
          labels: {
            interactive: true,
            update: {
              fontSize: { value: 17 },
              fill: { value: config.legendTextColor },
            },

          },
        },
      },
    ];
  } else {
    config.legend = null;
  }

  return {
    width: config.width,
    height: config.height,
    autosize: { type: 'fit', resize: true },

    background: config.toggleInvert,
    padding: 5,
    data: [{
      name: 'embeddingCat',
      transform: [{
        type: 'joinaggregate',
        groupby: ['cluster_id'],
        fields: ['UMAP_1', 'UMAP_2'],
        ops: ['mean', 'mean'],
        as: ['um1', 'um2'],
      }],
    },

    {
      name: 'cluster_labels',
      source: 'embeddingCat',
      transform: [{
        type: 'joinaggregate',
        fields: ['UMAP_1', 'UMAP_2'],
        ops: ['mean', 'mean'],
        as: ['um1', 'um2'],
      }],
    }],

    scales: [
      {
        name: 'x',
        type: 'linear',
        round: true,
        nice: true,
        domain: { data: 'embeddingCat', field: 'UMAP_1' },
        range: 'width',
      },
      {
        name: 'y',
        type: 'linear',
        round: true,
        nice: true,
        zero: true,
        domain: { data: 'embeddingCat', field: 'UMAP_2' },
        range: 'height',
      },
      {
        name: 'color',
        type: 'ordinal',
        range:
              [
                'red', 'green', 'blue', 'teal', 'orange', 'purple', 'cyan', 'magenta',
              ],
        domain: {
          data: 'embeddingCat',
          field: 'cluster_id',
          sort: true,
        },

      },
    ],

    axes: [
      {
        scale: 'x',
        grid: true,
        domain: true,
        orient: 'bottom',
        title: { value: config.xAxisText },
        titleFont: { value: config.masterFont },
        labelFont: { value: config.masterFont },
        titleFontSize: { value: config.axisTitlesize },
        labelFontSize: { value: config.axisTicks },
        offset: { value: config.axisOffset },
        gridOpacity: { value: (config.transGrid / 20) },
      },
      {
        scale: 'y',
        grid: true,
        domain: true,
        orient: 'left',
        titlePadding: 5,
        title: { value: config.yAxisText },
        titleFont: { value: config.masterFont },
        labelFont: { value: config.masterFont },
        titleFontSize: { value: config.axisTitlesize },
        labelFontSize: { value: config.axisTicks },
        offset: { value: config.axisOffset },
        gridOpacity: { value: (config.transGrid / 20) },
      },
    ],
    marks: [
      {
        type: 'symbol',
        from: { data: 'embeddingCat' },
        encode: {
          enter: {
            x: { scale: 'x', field: 'UMAP_1' },
            y: { scale: 'y', field: 'UMAP_2' },
            size: { value: config.pointSize },
            stroke: {
              scale: 'color',
              field: 'cluster_id',
            },
            fill: {
              scale: 'color',
              field: 'cluster_id',
            },
            shape: { value: config.pointStyle },
            fillOpacity: { value: config.pointOpa / 10 },
          },
        },
      },
      {
        type: 'text',
        from: { data: 'embeddingCat' },
        encode: {
          enter: {
            x: { scale: 'x', field: 'um1' },
            y: { scale: 'y', field: 'um2' },

            text: {
              field: 'cluster_id',

            },

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

    legends: config.legend,

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

const generateCellSetClusterPlotSpec = (config) => {
  if (config.toggleInvert === '#000000') {
    config.reverseCbar = true;
    config.masterColour = '#FFFFFF';
    config.legendTextColor = '#FFFFFF';
  }
  if (config.toggleInvert === '#FFFFFF') {
    config.reverseCbar = false;
    config.masterColour = '#000000';
    config.legendTextColor = '#000000';
  }

  if (config.labelsEnabled) {
    config.labelShow = 1;
  } else {
    config.labelShow = 0;
  }

  if (config.legendEnabled) {
    config.legend = [
      {
        title: '',
        titleColor: config.masterColour,
        fill: 'color',
        orient: config.legendPosition,
        rowPadding: 5,
        symbolSize: 200,

        encode: {
          title: {
            update: {
              fontSize: { value: 14 },
            },
          },
          labels: {
            interactive: true,
            update: {
              fontSize: { value: 17 },
              fill: { value: config.legendTextColor },
            },

          },
        },
      },
    ];
  } else {
    config.legend = null;
  }

  return {
    width: config.width,
    height: config.height,
    autosize: { type: 'fit', resize: true },

    background: config.toggleInvert,
    padding: 5,
    data: [{
      name: 'embeddingCat',
      transform: [{
        type: 'joinaggregate',
        groupby: ['cluster_id'],
        fields: ['UMAP_1', 'UMAP_2'],
        ops: ['mean', 'mean'],
        as: ['um1', 'um2'],
      }],
    },

    {
      name: 'cluster_labels',
      source: 'embeddingCat',
      transform: [{
        type: 'joinaggregate',
        fields: ['UMAP_1', 'UMAP_2'],
        ops: ['mean', 'mean'],
        as: ['um1', 'um2'],
      }],
    }],

    scales: [
      {
        name: 'x',
        type: 'linear',
        round: true,
        nice: true,
        domain: { data: 'embeddingCat', field: 'UMAP_1' },
        range: 'width',
      },
      {
        name: 'y',
        type: 'linear',
        round: true,
        nice: true,
        zero: true,
        domain: { data: 'embeddingCat', field: 'UMAP_2' },
        range: 'height',
      },
      {
        name: 'color',
        type: 'ordinal',
        range:
              [
                'red', 'green', 'blue', 'teal', 'orange', 'purple', 'cyan', 'magenta',
              ],
        domain: {
          data: 'embeddingCat',
          field: 'cluster_id',
          sort: true,
        },

      },
    ],

    axes: [
      {
        scale: 'x',
        grid: true,
        domain: true,
        orient: 'bottom',
        title: { value: config.xAxisText },
        titleFont: { value: config.masterFont },
        labelFont: { value: config.masterFont },
        titleFontSize: { value: config.axisTitlesize },
        labelFontSize: { value: config.axisTicks },
        offset: { value: config.axisOffset },
        gridOpacity: { value: (config.transGrid / 20) },
      },
      {
        scale: 'y',
        grid: true,
        domain: true,
        orient: 'left',
        titlePadding: 5,
        title: { value: config.yAxisText },
        titleFont: { value: config.masterFont },
        labelFont: { value: config.masterFont },
        titleFontSize: { value: config.axisTitlesize },
        labelFontSize: { value: config.axisTicks },
        offset: { value: config.axisOffset },
        gridOpacity: { value: (config.transGrid / 20) },
      },
    ],
    marks: [
      {
        type: 'symbol',
        from: { data: 'embeddingCat' },
        encode: {
          enter: {
            x: { scale: 'x', field: 'UMAP_1' },
            y: { scale: 'y', field: 'UMAP_2' },
            size: { value: config.pointSize },
            stroke: {
              scale: 'color',
              field: 'cluster_id',
            },
            fill: {
              scale: 'color',
              field: 'cluster_id',
            },
            shape: { value: config.pointStyle },
            fillOpacity: { value: config.pointOpa / 10 },
          },
        },
      },
      {
        type: 'text',
        from: { data: 'embeddingCat' },
        encode: {
          enter: {
            x: { scale: 'x', field: 'um1' },
            y: { scale: 'y', field: 'um2' },

            text: {
              field: 'cluster_id',

            },

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

    legends: config.legend,

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

const generateDoubletScorePlotSpec = (config) => {
  if (config.toggleInvert === '#000000') {
    config.reverseCbar = true;
    config.masterColour = '#FFFFFF';
    config.legendTextColor = '#FFFFFF';
  }
  if (config.toggleInvert === '#FFFFFF') {
    config.reverseCbar = false;
    config.masterColour = '#000000';
    config.legendTextColor = '#000000';
  }

  if (config.labelsEnabled) {
    config.labelShow = 1;
  } else {
    config.labelShow = 0;
  }

  if (config.legendEnabled) {
    config.legend = [
      {
        title: '',
        titleColor: config.masterColour,
        fill: 'color',
        orient: config.legendPosition,
        rowPadding: 5,
        symbolSize: 200,

        encode: {
          title: {
            update: {
              fontSize: { value: 14 },
            },
          },
          labels: {
            interactive: true,
            update: {
              fontSize: { value: 17 },
              fill: { value: config.legendTextColor },
            },

          },
        },
      },
    ];
  } else {
    config.legend = null;
  }

  return {

    width: config.width,
    height: config.height,
    autosize: { type: 'fit', resize: true },

    background: config.toggleInvert,
    padding: 5,
    data: {
      name: 'embeddingCat',
      transform: [{
        type: 'filter',
        expr: "datum.doubletScore !== 'NA'",
      },
      { type: 'formula', as: 'geneExpression', expr: 'datum.doubletScore*1' },
      { type: 'formula', as: 'umap1', expr: 'datum.UMAP_1*1' },
      { type: 'formula', as: 'umap2', expr: 'datum.UMAP_2*1' }],
    },
    scales: [
      {
        name: 'x',
        type: 'linear',
        round: true,
        nice: true,
        domain: { data: 'embeddingCat', field: 'UMAP_1' },
        range: 'width',
      },
      {
        name: 'y',
        type: 'linear',
        round: true,
        nice: true,
        domain: { data: 'embeddingCat', field: 'UMAP_2' },
        range: 'height',
      },
      {
        name: 'color',
        type: 'linear',
        range: { scheme: config.colGradient },
        domain: { data: 'embeddingCat', field: 'geneExpression' },
        reverse: config.reverseCbar,
      },

    ],

    axes: [
      {
        scale: 'x',
        grid: true,
        domain: true,
        orient: 'bottom',
        title: { value: config.xAxisText2 },
        titleFont: { value: config.masterFont },
        labelFont: { value: config.masterFont },
        titleFontSize: { value: config.axisTitlesize },
        labelFontSize: { value: config.axisTicks },
        offset: { value: config.axisOffset },
        gridOpacity: { value: (config.transGrid / 20) },
      },
      {
        scale: 'y',
        grid: true,
        domain: true,
        orient: 'left',
        titlePadding: 5,
        title: { value: config.yAxisText2 },
        titleFont: { value: config.masterFont },
        labelFont: { value: config.masterFont },
        titleFontSize: { value: config.axisTitlesize },
        labelFontSize: { value: config.axisTicks },
        offset: { value: config.axisOffset },
        gridOpacity: { value: (config.transGrid / 20) },
      },
    ],
    marks: [
      {
        type: 'symbol',
        from: { data: 'embeddingCat' },
        encode: {
          enter: {
            x: { scale: 'x', field: 'umap1' },
            y: { scale: 'y', field: 'umap2' },
            size: { value: config.pointSize },
            stroke: {
              scale: 'color',
              field: 'geneExpression',
            },
            fill: {
              scale: 'color',
              field: 'geneExpression',
            },
            shape: { value: config.pointStyle },
            fillOpacity: { value: config.pointOpa / 10 },
          },
        },
      },

    ],
    legends: config.legend,
    title:
      {
        text: { value: config.titleText },
        color: { value: config.masterColour },
        anchor: { value: config.titleAnchor },
        font: { value: config.masterFont },
        dx: { value: config.bounceX },
        fontSize: { value: config.titleSize },
      },
  };
};

const generateMitochondrialFractionReadsSpec = (config) => {
  if (config.toggleInvert === '#000000') {
    config.reverseCbar = true;
    config.masterColour = '#FFFFFF';
    config.legendTextColor = '#FFFFFF';
  }
  if (config.toggleInvert === '#FFFFFF') {
    config.reverseCbar = false;
    config.masterColour = '#000000';
    config.legendTextColor = '#000000';
  }

  if (config.labelsEnabled) {
    config.labelShow = 1;
  } else {
    config.labelShow = 0;
  }

  if (config.legendEnabled) {
    config.legend = [
      {
        title: '',
        titleColor: config.masterColour,
        fill: 'color',
        orient: config.legendPosition,
        rowPadding: 5,
        symbolSize: 200,

        encode: {
          title: {
            update: {
              fontSize: { value: 14 },
            },
          },
          labels: {
            interactive: true,
            update: {
              fontSize: { value: 17 },
              fill: { value: config.legendTextColor },
            },

          },
        },
      },
    ];
  } else {
    config.legend = null;
  }

  return {
    width: config.width,
    height: config.height,
    autosize: { type: 'fit', resize: true },

    background: config.toggleInvert,
    padding: 5,
    data: [{
      name: 'embeddingCat',
      transform: [{
        type: 'joinaggregate',
        groupby: ['cluster_id'],
        fields: ['UMAP_1', 'UMAP_2'],
        ops: ['mean', 'mean'],
        as: ['um1', 'um2'],
      }],
    },

    {
      name: 'cluster_labels',
      source: 'embeddingCat',
      transform: [{
        type: 'joinaggregate',
        fields: ['UMAP_1', 'UMAP_2'],
        ops: ['mean', 'mean'],
        as: ['um1', 'um2'],
      }],
    }],

    scales: [
      {
        name: 'x',
        type: 'linear',
        round: true,
        nice: true,
        domain: { data: 'embeddingCat', field: 'UMAP_1' },
        range: 'width',
      },
      {
        name: 'y',
        type: 'linear',
        round: true,
        nice: true,
        zero: true,
        domain: { data: 'embeddingCat', field: 'UMAP_2' },
        range: 'height',
      },
      {
        name: 'color',
        type: 'ordinal',
        range:
              [
                'red', 'green', 'blue', 'teal', 'orange', 'purple', 'cyan', 'magenta',
              ],
        domain: {
          data: 'embeddingCat',
          field: 'cluster_id',
          sort: true,
        },

      },
    ],

    axes: [
      {
        scale: 'x',
        grid: true,
        domain: true,
        orient: 'bottom',
        title: { value: config.xAxisText },
        titleFont: { value: config.masterFont },
        labelFont: { value: config.masterFont },
        titleFontSize: { value: config.axisTitlesize },
        labelFontSize: { value: config.axisTicks },
        offset: { value: config.axisOffset },
        gridOpacity: { value: (config.transGrid / 20) },
      },
      {
        scale: 'y',
        grid: true,
        domain: true,
        orient: 'left',
        titlePadding: 5,
        title: { value: config.yAxisText },
        titleFont: { value: config.masterFont },
        labelFont: { value: config.masterFont },
        titleFontSize: { value: config.axisTitlesize },
        labelFontSize: { value: config.axisTicks },
        offset: { value: config.axisOffset },
        gridOpacity: { value: (config.transGrid / 20) },
      },
    ],
    marks: [
      {
        type: 'symbol',
        from: { data: 'embeddingCat' },
        encode: {
          enter: {
            x: { scale: 'x', field: 'UMAP_1' },
            y: { scale: 'y', field: 'UMAP_2' },
            size: { value: config.pointSize },
            stroke: {
              scale: 'color',
              field: 'cluster_id',
            },
            fill: {
              scale: 'color',
              field: 'cluster_id',
            },
            shape: { value: config.pointStyle },
            fillOpacity: { value: config.pointOpa / 10 },
          },
        },
      },
      {
        type: 'text',
        from: { data: 'embeddingCat' },
        encode: {
          enter: {
            x: { scale: 'x', field: 'um1' },
            y: { scale: 'y', field: 'um2' },

            text: {
              field: 'cluster_id',

            },

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

    legends: config.legend,

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
  generateSamplePlotSpec,
  generateCellSetClusterPlotSpec,
  generateMitochondrialFractionReadsSpec,
  generateDoubletScorePlotSpec,
};
