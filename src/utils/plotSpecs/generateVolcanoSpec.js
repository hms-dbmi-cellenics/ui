import _ from 'lodash';

const generateSpec = (configSrc, plotData) => {
  const config = _.cloneDeep(configSrc);

  const logFoldChangeThresholdColor = config.showLogFoldChangeThresholdGuides
    ? config.logFoldChangeThresholdColor
    : '#ffffff00';

  const pvalueThresholdColor = config.showpvalueThresholdGuides
    ? config.pvalueThresholdColor
    : '#ffffff00';

  if (config.colour.toggleInvert === '#000000') {
    config.colour.reverseColourBar = true;
    config.colour.masterColour = '#FFFFFF';
  }
  if (config.colour.toggleInvert === '#FFFFFF') {
    config.colour.reverseColourBar = false;
    config.colour.masterColour = '#000000';
  }

  const xScaleDomain = config.axesRanges.xAxisAuto
    ? { data: 'data', field: 'logFC' }
    : [config.axesRanges.xMin, config.axesRanges.xMax];

  const yScaleDomain = config.axesRanges.yAxisAuto
    ? { data: 'data', field: 'neglogpvalue' }
    : [config.axesRanges.yMin, config.axesRanges.yMax];

  // adding gene labels above the set Y value only for the significant genes
  const geneLabelsEquation = `datum.logFC !== 'NA' && (datum.neglogpvalue >${config.textThresholdValue} && (datum.status == 'Upregulated' || datum.status == 'Downregulated'))`;

  let legend = [];
  if (config.legend.enabled) {
    legend = [
      {
        fill: 'color',
        orient: config.legend.position,
        encode: {
          title: {
            update: {
              fontSize: 14,
            },
          },
          labels: {
            update: {
              fontSize: { value: 12 },
              fill: { value: config.colour.masterColour },
            },
          },
          symbols: {
            update: {
              stroke: 'transparent',
              shape: { value: config.marker.shape },
            },
          },
          legend: {
            update: {
              stroke: '#ccc',
              strokeWidth: 1.5,
            },
          },
        },
      },
    ];
  }
  const spec = {
    width: config.dimensions.width,
    height: config.dimensions.height,
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    background: config.colour.toggleInvert,
    padding: 5,
    data: [
      {
        name: 'data',
        values: plotData,
        // Vega internally modifies objects during data transforms. If the plot data is frozen,
        // Vega is not able to carry out the transform and will throw an error.
        // https://github.com/vega/vega/issues/2453#issuecomment-604516777
        format: {
          type: 'json',
          copy: true,
        },
        transform: [
          {
            type: 'filter',
            expr: 'datum.logFC && datum.p_val_adj && datum.logFC !== 0 && datum.p_val_adj !== 0',
          },
          {
            type: 'formula',
            as: 'neglogpvalue',

            expr: '-(log(datum.p_val_adj) / LN10)',
          },
        ],
      },
      {
        name: 'dex2',
        source: 'data',
        transform: [
          {
            type: 'filter',
            expr: geneLabelsEquation,
          }],
      },
    ],

    scales: [
      {
        name: 'x',
        type: 'linear',
        nice: true,
        zero: false,
        domain: xScaleDomain,
        range: 'width',
      },
      {
        name: 'y',
        type: 'linear',
        nice: true,
        zero: false,
        domain: yScaleDomain,
        range: 'height',
      },
      {
        name: 'color',
        type: 'ordinal',

        // specifying a domain and a range like this works
        // like a map of values to colours
        domain: [
          'Upregulated',
          'No difference',
          'Downregulated',
        ],
        range:
          [
            config.significantUpregulatedColor,
            config.noDifferenceColor,
            config.significantDownregulatedColor,
          ],
      },
    ],

    axes: [
      {
        scale: 'x',
        grid: true,
        domain: true,
        orient: 'bottom',
        title: config.axes.xAxisText,
        titleFont: config.fontStyle.font,
        labelFont: config.fontStyle.font,
        labelColor: config.colour.masterColour,
        tickColor: config.colour.masterColour,
        gridColor: config.colour.masterColour,
        gridOpacity: (config.axes.gridOpacity / 20),
        gridWidth: (config.axes.gridWidth / 20),
        offset: config.axes.offset,
        titleFontSize: config.axes.titleFontSize,
        titleColor: config.colour.masterColour,
        labelFontSize: config.axes.labelFontSize,
        domainWidth: config.axes.domainWidth,
        labelAngle: config.axes.xAxisRotateLabels ? 45 : 0,
        labelAlign: config.axes.xAxisRotateLabels ? 'left' : 'center',
      },
      {
        scale: 'y',
        grid: true,
        domain: true,
        orient: 'left',
        title: config.axes.yAxisText,
        titleFont: config.fontStyle.font,
        labelFont: config.fontStyle.font,
        labelColor: config.colour.masterColour,
        tickColor: config.colour.masterColour,
        gridColor: config.colour.masterColour,
        gridOpacity: (config.axes.gridOpacity / 20),
        gridWidth: (config.axes.gridWidth / 20),
        offset: config.axes.offset,
        titleFontSize: config.axes.titleFontSize,
        titleColor: config.colour.masterColour,
        labelFontSize: config.axes.labelFontSize,
        domainWidth: config.axes.domainWidth,
      },
    ],

    title:
    {
      text: config.title.text,
      color: config.colour.masterColour,
      anchor: config.title.anchor,
      font: config.fontStyle.font,
      dx: 10,
      fontSize: config.title.fontSize,
    },

    marks: [
      {
        type: 'symbol',
        clip: true,
        from: { data: 'data' },
        encode: {
          enter: {
            x: { scale: 'x', field: 'logFC' },
            y: { scale: 'y', field: 'neglogpvalue' },
            size: { value: config.marker.size },
            shape: { value: config.marker.shape },
            strokeWidth: 1,
            strokeOpacity: config.strokeOpa,
            stroke: {
              scale: 'color',
              field: 'status',
            },
            fillOpacity: config.marker.opacity / 10,
            fill: {
              scale: 'color',
              field: 'status',
            },
          },
        },
      },
      {
        type: 'text',
        clip: true,
        from: { data: 'dex2' },
        encode: {
          enter: {
            x: { scale: 'x', field: 'logFC' },
            y: { scale: 'y', field: 'neglogpvalue' },

            fill: { value: config.colour.masterColour },
            text: { field: 'gene_names' },
          },
          transform: [
            { type: 'label', size: ['width', 'height'] }],
        },
      },
      {
        type: 'rule',
        clip: true,
        encode: {
          enter: {
            x: {
              scale: 'x',
              value: config.logFoldChangeThreshold,
              round: true,
            },
            y: 0,
            y2: { field: { group: 'height' } },
            stroke: {
              value: logFoldChangeThresholdColor,
            },
            strokeWidth: {
              value: config.thresholdGuideWidth,
            },
          },
        },
      },
      {
        type: 'rule',
        clip: true,
        encode: {
          enter: {
            x: {
              scale: 'x',
              value: config.logFoldChangeThreshold * -1,
              round: true,
            },
            y: 0,
            y2: { field: { group: 'height' } },
            stroke: {
              value: logFoldChangeThresholdColor,
            },
            strokeWidth: {
              value: config.thresholdGuideWidth,
            },
          },
        },
      },
      {
        type: 'rule',
        clip: true,
        encode: {
          enter: {
            y: {
              scale: 'y',
              value: config.negLogpValueThreshold,
              round: true,
            },
            x: 0,
            x2: { field: { group: 'width' } },
            stroke: {
              value: pvalueThresholdColor,
            },
            strokeWidth: {
              value: config.thresholdGuideWidth,
            },
          },
        },
      },
    ],

    legends: legend,
  };

  return spec;
};

// eslint-disable-next-line import/prefer-default-export
export { generateSpec };
