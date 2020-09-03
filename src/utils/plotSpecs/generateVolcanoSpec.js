import _ from 'lodash';

const generateSpec = (configSrc, data) => {
  const config = _.cloneDeep(configSrc);

  let maxNegativeLogpValue = 0;
  let l2fcMin = null;
  let l2fcMax = null;
  let xMax = null;

  data.forEach((o) => {
    Object.keys(o).forEach((k) => {
      if (k === 'qval' && o[k] && o[k] !== 0) {
        maxNegativeLogpValue = Math.max(
          maxNegativeLogpValue, -Math.log10(o[k]),
        );
      }
    });
  });

  data.forEach((o) => {
    Object.keys(o).forEach((k) => {
      if (k === 'log2fc' && o[k] && o[k] !== 1 && o[k] !== 0) {
        l2fcMin = Math.min(l2fcMin, o[k]);
        l2fcMax = Math.max(l2fcMax, o[k]);
      }
    });
  });

  if (Math.abs(l2fcMin) > Math.abs(l2fcMax)) {
    xMax = Math.abs(l2fcMin);
  } else {
    xMax = Math.abs(l2fcMax);
  }
  const logFoldChangeFilterExpr = (config.logFoldChangeDomain)
    ? `datum.log2fc > ${config.logFoldChangeDomain * -1} && datum.log2fc < ${config.logFoldChangeDomain}`
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

  if (config.toggleInvert === '#000000') {
    config.reverseCbar = true;
    config.masterColour = '#FFFFFF';
  }
  if (config.toggleInvert === '#FFFFFF') {
    config.reverseCbar = false;
    config.masterColour = '#000000';
  }
  // Domain specifiers for the volcano plot axes.
  // If a logFoldChangeDomain is defined by the user (e.g. through the
  // interface by deselecting Auto and entering a custom value), use
  // their specified range. If not, scale the plot based on the range of
  // the data in the set.
  const logFoldChangeDomain = config.logFoldChangeDomain
    ? [config.logFoldChangeDomain * -1, config.logFoldChangeDomain]
    : { data: 'data', field: 'log2fc' };

  const maxNegativeLogpValueDomain = config.maxNegativeLogpValueDomain
    ? [0, config.maxNegativeLogpValueDomain]
    : { data: 'data', field: 'neglogpvalue' };

  const x = (config.textThresholdValue);

  const textThreshold = ` ${x}`;
  const textEquation = `datum.log2fc !== 'NA' && datum.neglogpvalue >${textThreshold}`;
  let legend = [];
  if (config.legendEnabled) {
    legend = [
      {
        fill: 'color',
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
              fill: { value: config.masterColour },
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
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    description: 'A basic scatter plot example depicting automobile statistics.',
    width: config.width,
    height: config.height,
    background: config.toggleInvert,
    padding: 5,
    data: [
      {
        name: 'data',
        transform: [
          {
            type: 'filter',
            expr: 'datum.log2fc && datum.qval && datum.log2fc !== 0 && datum.qval !== 0',
          },
          {
            type: 'formula',
            as: 'neglogpvalue',

            expr: '-(log(datum.qval) / LN10)',
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
        range:
          [
            config.significantUpregulatedColor,
            config.significantDownregulatedColor,
            config.notSignificantUpregulatedColor,
            config.notSignificantDownregulatedColor,
            config.significantChangeDirectionUnknownColor,
            config.noDifferenceColor,
          ],
        domain: {
          data: 'data',
          field: 'status',
          sort: true,
          reverse: config.reverseCbar,

        },
      },

    ],
    axes: [
      {
        scale: 'x',
        grid: true,
        domain: true,
        orient: 'bottom',
        title: { value: config.xaxisText },
        titleFont: { value: config.masterFont },
        labelFont: { value: config.masterFont },
        labelColor: { value: config.masterColour },
        tickColor: { value: config.masterColour },
        gridColor: { value: config.masterColour },
        gridOpacity: { value: (config.transGrid / 20) },
        gridWidth: { value: (config.widthGrid / 20) },
        offset: { value: config.axesOffset },
        titleFontSize: { value: config.axisTitlesize },
        titleColor: { value: config.masterColour },
        labelFontSize: { value: config.axisTicks },
        domainWidth: { value: config.lineWidth },
      },
      {
        scale: 'y',
        grid: true,
        domain: true,
        orient: 'left',
        titlePadding: 5,
        gridColor: { value: config.masterColour },
        gridOpacity: { value: (config.transGrid / 20) },
        gridWidth: { value: (config.widthGrid / 20) },
        tickColor: { value: config.masterColour },
        offset: { value: config.axesOffset },
        title: { value: config.yaxisText },
        titleFont: { value: config.masterFont },
        labelFont: { value: config.masterFont },
        labelColor: { value: config.masterColour },
        titleFontSize: { value: config.axisTitlesize },
        titleColor: { value: config.masterColour },
        labelFontSize: { value: config.axisTicks },
        domainWidth: { value: config.lineWidth },

      },
    ],
    title:
    {
      text: { value: config.titleText },
      color: { value: config.masterColour },
      anchor: { value: config.titleAnchor },
      font: { value: config.masterFont },
      dx: 10,
      fontSize: { value: config.titleSize },
    },
    marks: [
      {
        type: 'symbol',
        from: { data: 'data' },
        encode: {
          enter: {
            x: { scale: 'x', field: 'log2fc' },
            y: { scale: 'y', field: 'neglogpvalue' },
            size: { value: config.pointSize },
            shape: { value: config.pointStyle },
            strokeWidth: { value: 1 },
            strokeOpacity: { value: config.strokeOpa },
            stroke: {
              scale: 'color',
              field: 'status',
            },
            fillOpacity: { value: config.pointOpa / 10 },
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
            x: { scale: 'x', field: 'log2fc' },
            y: { scale: 'y', field: 'neglogpvalue' },

            fill: { value: config.masterColour },
            text: { field: 'Rownames' },
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
    spec, maxNegativeLogpValue, xMax,
  };
};

export default generateSpec;
