// Histogram of spatial local-outlier z-scores for a data-processing filter.
// Bars beyond the cutoff (per direction) are coloured as outliers and a dashed
// rule marks the threshold. Mirrors generateDoubletScoreHistogram.
//
// @param {object} config   merged plot + filter config (reads cutoff, binStep, axes…)
// @param {Array}  plotData array of { zscore } records
// @param {string} direction 'lower' | 'upper' — which tail is removed
const generateSpec = (config, plotData, direction = 'lower') => {
  const cutoff = config.cutoff ?? 3;

  // z-scores are unbounded and can be negative — derive the domain from the data.
  let minZ = -cutoff * 2;
  let maxZ = cutoff * 2;
  if (plotData?.length) {
    minZ = Infinity;
    maxZ = -Infinity;
    plotData.forEach(({ zscore }) => {
      if (zscore < minZ) minZ = zscore;
      if (zscore > maxZ) maxZ = zscore;
    });
    // make sure the cutoff rule is always visible within the domain
    minZ = Math.min(minZ, -cutoff);
    maxZ = Math.max(maxZ, cutoff);
  }
  const extent = [minZ, maxZ];

  const generateStatus = direction === 'upper'
    ? `(datum.bin1 > ${cutoff}) ? 'outlier' : 'kept'`
    : `(datum.bin0 < ${-cutoff}) ? 'outlier' : 'kept'`;

  const ruleValue = direction === 'upper' ? cutoff : -cutoff;

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
        values: plotData,
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
            field: 'zscore',
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
            expr: generateStatus,
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
        title: config.axes.xAxisText,
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
      {
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
      },
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

export default generateSpec;
