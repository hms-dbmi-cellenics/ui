import _ from 'lodash';

const generateSpec = (config, { FDR }, plotData) => {
  let legend = null;

  let firstLowQualityIndex;
  let lastHighQualityIndex;
  const ntot = plotData.map((item) => item.ndrops).reduce((a, b) => a + b, 0);
  let nkeep;

  if (FDR === 1) {
    firstLowQualityIndex = lastHighQualityIndex = plotData.length - 1;
    nkeep = ntot;
  } else if (FDR === 0) {
    firstLowQualityIndex = lastHighQualityIndex = 0;
    nkeep = 0;
  } else {
    firstLowQualityIndex = _.findIndex(
      plotData,
      (element) => element.fdr > FDR,
    );
    lastHighQualityIndex = _.findLastIndex(
      plotData,
      (element) => element.fdr <= FDR,
    );
    nkeep = plotData
      .filter((item) => item.fdr < FDR);

    nkeep = nkeep.map((item) => item.ndrops)
      .reduce((a, b) => a + b, 0);
  }

  const ndiscard = ntot - nkeep;
  const firstLowQualityRank = plotData[firstLowQualityIndex]?.rank;
  const lastHighQualityRank = plotData[lastHighQualityIndex]?.rank;

  // format with commas for thousandths
  const formatInt = (int) => int.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // plot is in log scale, minimum shouldn't be below 1
  const xScaleDomain = config.axesRanges.xAxisAuto
    ? { data: 'plotData', field: 'rank' }
    : [Math.max(config.axesRanges.xMin, 1), config.axesRanges.xMax];

  const yScaleDomain = config.axesRanges.yAxisAuto
    ? { data: 'plotData', field: 'u' }
    : [Math.max(config.axesRanges.yMin, 1), config.axesRanges.yMax];

  const defaultLegendTitle = 'FDR Threshold';
  const legendTitle = config.legend.defaultValues?.includes('title')
    ? defaultLegendTitle
    : config.legend.title;
  const legendDirection = ['top', 'bottom'].includes(config.legend.position)
    ? 'horizontal'
    : 'vertical';

  legend = !config.legend.enabled ? null : [
    {
      fill: 'keep',
      orient: 'none',
      direction: 'vertical',
      rowPadding: 5,
      title: null,
      labelFont: config.fontStyle.font,
      encode: {
        labels: {
          interactive: true,
          update: {
            fontSize: { value: config.legend.labelFontSize || 11 },
            fill: { value: 'black' },
          },
        },
        title: {
          update: {
            fontSize: { value: config.legend.titleFontSize || 12 },
          },
        },
      },
    },
    {
      fill: 'color',
      orient: config.legend.position,
      direction: legendDirection,
      title: legendTitle,
      labelFont: config.fontStyle.font,
      titleFont: config.fontStyle.font,
      padding: 4,
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
            fill: { value: 'black' },
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
        // Vega internally modifies objects during data transforms. If the plot data is frozen,
        // Vega is not able to carry out the transform and will throw an error.
        // https://github.com/vega/vega/issues/2453#issuecomment-604516777
        format: {
          type: 'json',
          copy: true,
        },
      },
      {
        name: 'lowerHalfPlotData',
        source: 'plotData',
        transform: [
          {
            type: 'filter',
            expr: `datum.rank <= ${firstLowQualityRank}`,
          },
        ],
      },
      {
        name: 'unknownQualityPlotData',
        source: 'plotData',
        transform: [
          {
            type: 'filter',
            expr: `datum.rank >= ${firstLowQualityRank} & datum.rank <= ${lastHighQualityRank}`,
          },
        ],
      },
      {
        name: 'higherHalfPlotData',
        source: 'plotData',
        transform: [
          {
            type: 'filter',
            expr: `datum.rank >= ${lastHighQualityRank}`,
          },
        ],
      },
    ],

    scales: [
      {
        name: 'xscale',
        type: 'log',
        range: 'width',
        domain: xScaleDomain,
      },
      {
        name: 'yscale',
        type: 'log',
        nice: true,
        range: 'height',
        domain: yScaleDomain,
      },
      {
        name: 'color',
        type: 'ordinal',
        range: ['green', 'lightgray', '#f57b42'],
        domain: ['below', 'mixed', 'above'],
      },
      {
        name: 'keep',
        type: 'ordinal',
        domain: [`keep: ${formatInt(nkeep)}`, `discard: ${formatInt(ndiscard)}`],
      },
    ],

    axes: [
      {
        orient: 'bottom',
        scale: 'xscale',
        tickCount: 5,
        grid: true,
        zindex: 1,
        title: config.axes.xAxisText,
        titleFont: { value: config.fontStyle.font },
        labelFont: { value: config.fontStyle.font },
        titleFontSize: { value: config.axes.titleFontSize },
        labelFontSize: { value: config.axes.labelFontSize },
        offset: { value: config.axes.offset },
        gridOpacity: { value: config.axes.gridOpacity / 20 },
        labelAngle: config.axes.xAxisRotateLabels ? 45 : 0,
        labelAlign: config.axes.xAxisRotateLabels ? 'left' : 'center',
        labels: config.axes.xAxisLabels,
        ticks: config.axes.xAxisLabels,
      },
      {
        orient: 'left',
        scale: 'yscale',
        grid: true,
        zindex: 1,
        title: config.axes.yAxisText,
        titleFont: { value: config.fontStyle.font },
        labelFont: { value: config.fontStyle.font },
        titleFontSize: { value: config.axes.titleFontSize },
        labelFontSize: { value: config.axes.labelFontSize },
        offset: { value: config.axes.offset },
        gridOpacity: { value: config.axes.gridOpacity / 20 },
        labels: config.axes.yAxisLabels,
        ticks: config.axes.yAxisLabels,
      },
    ],

    marks: [
      {
        type: 'area',
        from: { data: 'lowerHalfPlotData' },
        clip: true,
        encode: {
          enter: {
            x: { scale: 'xscale', field: 'rank' },
            y: { scale: 'yscale', field: 'u' },
            y2: { scale: 'yscale', value: 1 },
            fill: { value: 'green' },
          },
        },
      },
      {
        type: 'area',
        from: { data: 'unknownQualityPlotData' },
        clip: true,
        encode: {
          enter: {
            x: { scale: 'xscale', field: 'rank' },
            y: { scale: 'yscale', field: 'u' },
            y2: { scale: 'yscale', value: 1 },
            fill: { value: 'lightgrey' },
          },
        },
      },
      {
        type: 'area',
        from: { data: 'higherHalfPlotData' },
        clip: true,
        encode: {
          enter: {
            x: { scale: 'xscale', field: 'rank' },
            y: { scale: 'yscale', field: 'u' },
            y2: { scale: 'yscale', value: 1 },
            fill: { value: '#f57b42' },
          },
        },
      },
    ],
    legends: legend,
    title: {
      text: config.title.text,
      anchor: { value: config.title.anchor },
      font: { value: config.fontStyle.font },
      dx: { value: config.title.dx },
      fontSize: { value: config.title.fontSize },
    },
  };
};

export default generateSpec;
