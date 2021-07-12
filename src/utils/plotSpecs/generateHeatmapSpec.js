const generateSpec = (config, groupName) => {
  let legend = [
    {
      fill: 'color',
      type: 'gradient',
      orient: 'bottom',
      direction: 'horizontal',
      title: ['Intensity'],
      labelFont: config.fontStyle.font,
      titleFont: config.fontStyle.font,
      gradientLength: {
        signal: 'width',
      },
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
            text: { scale: 'cellSetIDToName', field: 'label' },
          },
        },
      },
      labelFont: config.fontStyle.font,
      titleFont: config.fontStyle.font,
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
        gradientLength: {
          signal: 'height / 3',
        },
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
              text: { scale: 'cellSetIDToName', field: 'label' },
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
    $schema: 'http//s:vega.github.io/schema/vega/v5.json',
    width: config.dimensions.width,
    height: config.dimensions.height,
    autosize: { type: 'fit', resize: true },

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
        type: 'linear',
        range: {
          scheme: config.colour.gradient,
        },
        domain: {
          data: 'heatmapData',
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
        name: 'cellSetIDToName',
        type: 'ordinal',
        range: {
          data: 'trackGroupData',
          field: 'name',
        },
        domain: {
          data: 'trackGroupData',
          field: 'key',
        },
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
