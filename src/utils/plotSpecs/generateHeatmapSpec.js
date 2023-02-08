const generateSpec = (config, groupName, data, displayLabels = true) => {
  const cellSetNames = data.trackGroupData.map(({ name }) => name);

  const extraLabels = displayLabels ? [
    {
      domain: false,
      orient: 'left',
      scale: 'y',
    },
  ] : [];

  const orientation = config.legend.position === 'vertical'
    ? { orient: 'left' }
    : { orient: 'bottom', direction: 'horizontal' };

  const legend = [
    {
      fill: 'color',
      type: 'gradient',
      title: ['Intensity'],
      labelFont: config.fontStyle.font,
      titleFont: config.fontStyle.font,
      gradientLength: { signal: 'width' },
      labelSeparation: { signal: 'width' },
      ...orientation,
    },
  ];

  if (config.legend.enabled) {
    const paddingSize = 5;
    const characterSizeVertical = 14;
    const xTickSize = 140;

    const maxLegendItemsPerCol = Math.floor(
      (config.dimensions.height - xTickSize - (2 * paddingSize))
      / characterSizeVertical,
    );

    const numVerticalLegendColumns = Math.ceil(cellSetNames.length / maxLegendItemsPerCol);

    legend.push({
      fill: 'cellSetColors',
      title: groupName,
      type: 'symbol',
      orient: 'right',
      columns: numVerticalLegendColumns,
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
      labelFont: config.fontStyle.font,
      titleFont: config.fontStyle.font,
      symbolLimit: 0,
    });
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
