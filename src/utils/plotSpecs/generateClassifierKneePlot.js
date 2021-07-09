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
            fontSize: { value: 12 },
            fill: { value: 'black' },
          },
        },
      },
    },
    {
      fill: 'color',
      orient: config.legend.position,
      title: 'FDR Threshold',
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
        domain: { data: 'plotData', field: 'rank' },
      },
      {
        name: 'yscale',
        type: 'log',
        nice: true,
        range: 'height',
        domain: { data: 'plotData', field: 'u' },
      },
      {
        name: 'color',
        type: 'ordinal',
        range: ['green', 'lightgray', '#f57b42'],
        domain: ['above', 'mixed', 'below'],
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
