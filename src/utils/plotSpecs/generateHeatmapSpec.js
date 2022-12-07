const generateSpec = (config, groupName, data, displayLabels = true) => {
  const cellSetNames = data.trackGroupData.map(({ name }) => name);

  // Do not display gene labels by default if thre are more than 53
  // as the gene names will squash up

  const verticalLegendColumns = Math.ceil(cellSetNames.length / 20);
  const extraLabels = displayLabels ? [
    {
      domain: false,
      orient: 'left',
      scale: 'y',
    },
  ] : [];

  let legend = [
    {
      fill: 'color',
      type: 'gradient',
      orient: 'bottom',
      direction: 'horizontal',
      title: ['Intensity'],
      labelFont: config.fontStyle.font,
      titleFont: config.fontStyle.font,
      gradientLength: { signal: 'width' },
      labelSeparation: { signal: 'width' },
    },
    {
      fill: 'cellSetColors',
      title: groupName,
      type: 'symbol',
      orient: 'right',
      direction: 'vertical',
      offset: 40,
      symbolType: 'square',
      symbolSize: 200,
      encode: {
        labels: {
          update: {
            text: { scale: 'cellSetNames', field: 'label' },
          },
        },
      },
      columns: verticalLegendColumns,
      labelFont: config.fontStyle.font,
      titleFont: config.fontStyle.font,
      symbolLimit: 0,
    },
  ];

  if (config.legend.position === 'vertical') {
    legend = [
      {
        fill: 'color',
        type: 'gradient',
        title: ['Intensity'],
        orient: 'left',
        labelFont: config.fontStyle.font,
        titleFont: config.fontStyle.font,
        gradientLength: { signal: 'height / 3' },
        labelSeparation: { signal: 'height / 3' },
      },
      {
        fill: 'cellSetColors',
        title: groupName,
        type: 'symbol',
        orient: 'right',
        symbolType: 'square',
        symbolSize: 200,
        encode: {
          labels: {
            update: {
              text: { scale: 'cellSetNames', field: 'label' },
            },
          },
        },
        direction: 'vertical',
        labelFont: config.fontStyle.font,
        titleFont: config.fontStyle.font,
        labels: {
          text: 'asdsa',
        },
      }];
  }

  if (!config.legend.enabled) {
    legend = null;
  }

  return {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    width: config.dimensions.width,
    height: config.dimensions.height,
    autosize: { type: 'fit', resize: true },

    data: [
      {
        name: 'cellOrder',
        values: data.cellOrder,
        copy: true,
      },
      {
        name: 'geneOrder',
        values: data.geneOrder,
        copy: true,
      },
      {
        name: 'trackOrder',
        values: data.trackOrder,
      },
      {
        name: 'geneExpressionsData',
        values: data.geneExpressionsData,
      },
      {
        name: 'trackColorData',
        values: data.trackColorData,
      },
      {
        name: 'trackGroupData',
        values: data.trackGroupData,
      },
      {
        name: 'clusterSeparationLines',
        values: data.clusterSeparationLines,
        sort: 'ascending',
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
        type: 'quantize',
        range: {
          scheme: config.colour.gradient === 'default'
            ? 'purplered'
            : config.colour.gradient,
          count: 100,
        },
        domain: {
          data: 'geneExpressionsData',
          field: 'expression',
        },
        zero: false,
        nice: true,
      },
      {
        name: 'cellSetColors',
        type: 'ordinal',
        range: {
          data: 'trackGroupData',
          field: 'color',
        },
        domain: {
          data: 'trackGroupData',
          field: 'key',
        },
      },
      {
        name: 'cellSetNames',
        type: 'ordinal',
        range: cellSetNames,
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
      ...extraLabels,
    ],

    legends: legend,

    marks: [
      {
        type: 'rect',
        from: {
          data: 'trackColorData',
        },
        encode: {
          enter: {
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
          data: 'geneExpressionsData',
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
    title:
    {
      text: config.title.text,
      color: config.colour.masterColour,
      anchor: config.title.anchor,
      font: config.fontStyle.font,
      dx: config.title.dx,
      fontSize: config.title.fontSize,
    },
  };
};

const generateData = () => { };

export { generateSpec, generateData };
