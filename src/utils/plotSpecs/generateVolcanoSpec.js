import _ from 'lodash';

const generateSpec = (configSrc, data) => {
  const config = _.cloneDeep(configSrc);

  let maxNegativeLogpValue = 0;

  data.forEach((o) => {
    Object.keys(o).forEach((k) => {
      if (k === 'p_val_adj' && o[k] && o[k] !== 0) {
        maxNegativeLogpValue = Math.max(
          maxNegativeLogpValue, -Math.log10(o[k]),
        );
      }
    });
  });

  const logFoldChangeFilterExpr = (config.logFoldChangeDomain)
    ? `datum.avg_log2FC > ${config.logFoldChangeDomain * -1} && datum.avg_log2FC < ${config.logFoldChangeDomain}`
    : 'true';

  const negativeLogpValueFilterExpr = (config.maxNegativeLogpValueDomain)
    ? `datum.neglogpvalue < ${config.maxNegativeLogpValueDomain}`
    : 'true';

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
  // Domain specifiers for the volcano plot axes.
  // If a logFoldChangeDomain is defined by the user (e.g. through the
  // interface by deselecting Auto and entering a custom value), use
  // their specified range. If not, scale the plot based on the range of
  // the data in the set.
  const logFoldChangeDomain = config.logFoldChangeDomain
    ? [config.logFoldChangeDomain * -1, config.logFoldChangeDomain]
    : { data: 'data', field: 'avg_log2FC' };

  const maxNegativeLogpValueDomain = config.maxNegativeLogpValueDomain
    ? [0, config.maxNegativeLogpValueDomain]
    : { data: 'data', field: 'neglogpvalue' };

  const textEquation = `datum.avg_log2FC !== 'NA' && datum.neglogpvalue >${config.textThresholdValue}`;
  let legend = [];
  if (config.legend.enabled) {
    legend = [
      {
        fill: 'color',
        orient: config.legend.position,
        encode: {
          title: {
            update: {
              fontSize: { value: 14 },
            },
          },
          labels: {
            interactive: true,
            update: {
              fontSize: { value: 12 },
              fill: { value: config.colour.masterColour },
            },
            hover: {
              fill: { value: 'firebrick' },
            },
          },
          symbols: {
            update: {
              stroke: { value: 'transparent' },
            },
          },
          legend: {
            update: {
              stroke: { value: '#ccc' },
              strokeWidth: { value: 1.5 },
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
        transform: [
          {
            type: 'filter',
            expr: 'datum.avg_log2FC && datum.p_val_adj && datum.avg_log2FC !== 0 && datum.p_val_adj !== 0',
          },
          {
            type: 'formula',
            as: 'neglogpvalue',

            expr: '-(log(datum.p_val_adj) / LN10)',
          },
          {
            type: 'filter',
            expr: logFoldChangeFilterExpr,
          },
          {
            type: 'filter',
            expr: negativeLogpValueFilterExpr,
          },
        ],
      },
      {
        name: 'dex2',
        source: 'data',
        transform: [
          {
            type: 'filter',
            expr: textEquation,
          }],
      },

    ],

    scales: [
      {
        name: 'x',
        type: 'linear',
        round: true,
        nice: true,
        domain: logFoldChangeDomain,
        range: 'width',
      },
      {
        name: 'y',
        type: 'linear',
        round: true,
        nice: true,
        zero: true,
        domain: maxNegativeLogpValueDomain,
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
        title: { value: config.axes.xAxisText },
        titleFont: { value: config.fontStyle.font },
        labelFont: { value: config.fontStyle.font },
        labelColor: { value: config.colour.masterColour },
        tickColor: { value: config.colour.masterColour },
        gridColor: { value: config.colour.masterColour },
        gridOpacity: { value: (config.axes.gridOpacity / 20) },
        gridWidth: { value: (config.axes.gridWidth / 20) },
        offset: { value: config.axes.offset },
        titleFontSize: { value: config.axes.titleFontSize },
        titleColor: { value: config.colour.masterColour },
        labelFontSize: { value: config.axes.labelFontSize },
        domainWidth: { value: config.axes.domainWidth },
        labelAngle: config.axes.xAxisRotateLabels ? 45 : 0,
        labelAlign: config.axes.xAxisRotateLabels ? 'left' : 'center',
      },
      {
        scale: 'y',
        grid: true,
        domain: true,
        orient: 'left',
        title: { value: config.axes.yAxisText },
        titleFont: { value: config.fontStyle.font },
        labelFont: { value: config.fontStyle.font },
        labelColor: { value: config.colour.masterColour },
        tickColor: { value: config.colour.masterColour },
        gridColor: { value: config.colour.masterColour },
        gridOpacity: { value: (config.axes.gridOpacity / 20) },
        gridWidth: { value: (config.axes.gridWidth / 20) },
        offset: { value: config.axes.offset },
        titleFontSize: { value: config.axes.titleFontSize },
        titleColor: { value: config.colour.masterColour },
        labelFontSize: { value: config.axes.labelFontSize },
        domainWidth: { value: config.axes.domainWidth },
      },
    ],

    title:
    {
      text: { value: config.title.text },
      color: { value: config.colour.masterColour },
      anchor: { value: config.title.anchor },
      font: { value: config.fontStyle.font },
      dx: 10,
      fontSize: { value: config.title.fontSize },
    },

    marks: [
      {
        type: 'symbol',
        from: { data: 'data' },
        encode: {
          enter: {
            x: { scale: 'x', field: 'avg_log2FC' },
            y: { scale: 'y', field: 'neglogpvalue' },
            size: { value: config.marker.size },
            shape: { value: config.marker.shape },
            strokeWidth: { value: 1 },
            strokeOpacity: { value: config.strokeOpa },
            stroke: {
              scale: 'color',
              field: 'status',
            },
            fillOpacity: { value: config.marker.opacity / 10 },
            fill: {
              scale: 'color',
              field: 'status',
            },
          },
        },
      },
      {
        type: 'text',
        from: { data: 'dex2' },
        encode: {
          enter: {
            x: { scale: 'x', field: 'avg_log2FC' },
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
        encode: {
          update: {
            x: {
              scale: 'x',
              value: config.logFoldChangeThreshold,
              round: true,
            },
            y: { value: 0 },
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
        encode: {
          update: {
            x: {
              scale: 'x',
              value: config.logFoldChangeThreshold * -1,
              round: true,
            },
            y: { value: 0 },
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
        encode: {
          update: {
            y: {
              scale: 'y',
              value: config.negLogpValueThreshold,
              round: true,
            },
            x: { value: 0 },
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

  return {
    spec, maxNegativeLogpValue,
  };
};

const generateData = () => { };

export { generateSpec, generateData };
