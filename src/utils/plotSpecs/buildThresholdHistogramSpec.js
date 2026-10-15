// Shared vega spec for a spatial QC filter histogram: values binned on `field`,
// bars coloured kept/outlier by `statusExpr` and dashed red rules at `ruleValues`.
// Used for both the z-score histogram (local outliers) and the raw-metric
// histogram (absolute thresholds).
//
// @param {object} config    merged plot + filter config (reads binStep, axes…)
// @param {Array}  values    array of records holding `field`
// @param {object} options   { field, extent, statusExpr, ruleValues, xAxisTitle }
const buildThresholdHistogramSpec = (config, values, {
  field, extent, statusExpr, ruleValues, xAxisTitle,
}) => {
  const xScaleDomain = config.axesRanges.xAxisAuto
    ? extent
    : [config.axesRanges.xMin, config.axesRanges.xMax];

  const yScaleDomain = config.axesRanges.yAxisAuto
    ? { data: 'binned', field: 'count' }
    : [config.axesRanges.yMin, config.axesRanges.yMax];

  const legendDirection = ['top', 'bottom'].includes(config.legend.position)
    ? 'horizontal'
    : 'vertical';

  const legend = !config.legend.enabled ? null : [
    {
      fill: 'color',
      orient: config.legend.position,
      direction: legendDirection,
      title: 'Status',
      padding: 4,
      encode: {
        labels: {
          update: {
            fontSize: { value: config.legend.labelFontSize || 11 },
            fill: { value: 'black' },
          },
        },
        symbols: {
          update: {
            stroke: { value: 'transparent' },
          },
        },
      },
    }];

  return {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    width: config.dimensions.width,
    height: config.dimensions.height,
    autosize: { type: 'fit', resize: true },
    padding: 5,
    data: [
      {
        name: 'plotData',
        values,
        // Vega mutates objects during transforms; copy so frozen data doesn't error.
        // https://github.com/vega/vega/issues/2453#issuecomment-604516777
        format: { type: 'json', copy: true },
      },
      {
        name: 'binned',
        source: 'plotData',
        transform: [
          {
            type: 'bin',
            field,
            extent,
            step: config.binStep,
            nice: false,
          },
          {
            type: 'aggregate',
            key: 'bin0',
            groupby: ['bin0', 'bin1'],
            fields: ['bin0'],
            ops: ['count'],
            as: ['count'],
          },
          {
            type: 'formula',
            as: 'status',
            expr: statusExpr,
          },
        ],
      },
    ],
    scales: [
      {
        name: 'xscale',
        type: 'linear',
        range: 'width',
        domain: xScaleDomain,
        zero: false,
      },
      {
        name: 'yscale',
        type: 'linear',
        range: 'height',
        domain: yScaleDomain,
        nice: true,
        zero: false,
      },
      {
        name: 'color',
        type: 'ordinal',
        range: ['#2f9e44', 'red'],
        domain: ['kept', 'outlier'],
      },
    ],
    axes: [
      {
        orient: 'bottom',
        scale: 'xscale',
        grid: true,
        zindex: 1,
        title: xAxisTitle ?? config.axes.xAxisText,
        titleFont: config.fontStyle.font,
        labelFont: config.fontStyle.font,
        titleFontSize: config.axes.titleFontSize,
        labelFontSize: config.axes.labelFontSize,
        offset: config.axes.offset,
        gridOpacity: config.axes.gridOpacity / 20,
        labelAngle: config.axes.xAxisRotateLabels ? 45 : 0,
        labelAlign: config.axes.xAxisRotateLabels ? 'left' : 'center',
        labels: config.axes.xAxisLabels,
        ticks: config.axes.xAxisLabels,
      },
      {
        orient: 'left',
        scale: 'yscale',
        tickCount: 5,
        grid: true,
        zindex: 1,
        title: config.axes.yAxisText,
        titleFont: config.fontStyle.font,
        labelFont: config.fontStyle.font,
        titleFontSize: config.axes.titleFontSize,
        labelFontSize: config.axes.labelFontSize,
        offset: config.axes.offset,
        gridOpacity: config.axes.gridOpacity / 20,
        labels: config.axes.yAxisLabels,
        ticks: config.axes.yAxisLabels,
      },
    ],
    marks: [
      {
        type: 'rect',
        clip: true,
        from: { data: 'binned' },
        encode: {
          enter: {
            x: { scale: 'xscale', field: 'bin0' },
            x2: { scale: 'xscale', field: 'bin1' },
            y: { scale: 'yscale', field: 'count' },
            y2: { scale: 'yscale', value: 0 },
            fill: { scale: 'color', field: 'status' },
          },
        },
      },
      ...ruleValues.map((ruleValue) => ({
        type: 'rule',
        clip: true,
        encode: {
          update: {
            x: { scale: 'xscale', value: ruleValue },
            y: { value: 0 },
            y2: { field: { group: 'height' } },
            strokeWidth: { value: 2 },
            strokeDash: { value: [8, 4] },
            stroke: { value: 'red' },
          },
        },
      })),
    ],
    legends: legend,
    title: {
      text: config.title.text,
      anchor: config.title.anchor,
      font: config.fontStyle.font,
      dx: config.title.dx,
      fontSize: config.title.fontSize,
    },
  };
};

export default buildThresholdHistogramSpec;
