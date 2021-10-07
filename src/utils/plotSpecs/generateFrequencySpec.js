import _ from 'lodash';

import { intersection } from '../cellSetOperations';

const generateSpec = (config, { xNamesToDisplay, yNamesToDisplay, plotData }) => {
  let legend = [];

  if (config.legend.enabled) {
    const positionIsRight = config.legend.position === 'right';

    const legendColumns = positionIsRight ? 1 : Math.floor(config.dimensions.width / 85);
    const labelLimit = positionIsRight ? 0 : 85;

    legend = [
      {
        fill: 'color',
        title: 'Cell Set',
        titleColor: config.colour.masterColour,
        type: 'symbol',
        orient: config.legend.position,
        offset: 40,
        symbolType: 'square',
        symbolSize: 200,
        encode: {
          labels: {
            update: {
              text: {
                scale: 'yClusterKey', field: 'label',
              },
              fill: { value: config.colour.masterColour },
            },
          },
        },
        direction: 'horizontal',
        labelFont: config.fontStyle.font,
        titleFont: config.fontStyle.font,
        columns: legendColumns,
        labelLimit,
      },

    ];
  }

  const additionalTransform = config.frequencyType === 'proportional' ? [
    {
      type: 'joinaggregate',
      groupby: ['x'],
      ops: ['sum'],
      fields: ['y'],
      as: ['totalY'],
    },
    { type: 'formula', as: 'y', expr: '(datum.y / datum.totalY) * 100' },
  ] : [];

  return {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    width: config.dimensions.width,
    height: config.dimensions.height,
    autosize: { type: 'fit', resize: true },
    background: config.colour.toggleInvert,
    padding: 5,

    data: [
      {
        name: 'plotData',
        values: plotData,
        transform: [
          ...additionalTransform,
          {
            type: 'stack',
            groupby: ['x'],
            sort: { field: 'yClusterKey' },
            field: 'y',
          },
        ],
      },
    ],

    scales: [
      {
        name: 'xNames',
        type: 'ordinal',
        range: xNamesToDisplay,
      },
      {
        name: 'x',
        type: 'band',
        range: 'width',
        domain: { data: 'plotData', field: 'x' },
      },
      {
        name: 'y',
        type: 'linear',
        range: 'height',
        nice: true,
        zero: true,
        domain: config.frequencyType === 'proportional' ? [0, 100] : { data: 'plotData', field: 'y1' },
      },
      {
        name: 'yClusterKey',
        type: 'ordinal',
        range: yNamesToDisplay,
      },
      {
        name: 'color',
        type: 'ordinal',
        range: { data: 'plotData', field: 'color' },
        domain: { data: 'plotData', field: 'yClusterKey' },
      },
    ],

    axes: [
      {
        orient: 'bottom',
        scale: 'x',
        zindex: 1,
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
        encode: {
          labels: {
            update: {
              text: { signal: 'scale("xNames", datum.value)' },
            },
          },
        },
      },
      {
        orient: 'left',
        scale: 'y',
        zindex: 1,
        gridColor: config.colour.masterColour,
        gridOpacity: (config.axes.gridOpacity / 20),
        gridWidth: (config.axes.gridWidth / 20),
        tickColor: config.colour.masterColour,
        offset: config.axes.offset,
        title: config.axes.yAxisText,
        titleFont: config.fontStyle.font,
        labelFont: config.fontStyle.font,
        labelColor: config.colour.masterColour,
        titleFontSize: config.axes.titleFontSize,
        titleColor: config.colour.masterColour,
        labelFontSize: config.axes.labelFontSize,
        domainWidth: config.axes.domainWidth,
      },
    ],

    marks: [
      {
        type: 'rect',
        from: { data: 'plotData' },
        encode: {
          enter: {
            x: { scale: 'x', field: 'x' },
            width: { scale: 'x', band: 1, offset: -1 },
            y: { scale: 'y', field: 'y0' },
            y2: { scale: 'y', field: 'y1' },
            fill: { scale: 'color', field: 'yClusterKey' },
          },
          update: {
            fillOpacity: 1,
          },
        },
      },
    ],
    legends: legend,
    title:
    {
      text: config.title.text,
      color: config.colour.masterColour,
      anchor: config.title.anchor,
      font: config.fontStyle.font,
      dx: 10,
      fontSize: config.title.fontSize,
    },
  };
};

const generateData = (hierarchy, properties, config) => {
  // The key of the cell set root nodes to display on the x and y axes.
  const cellSetGroupByRoots = {
    x: config.xAxisGrouping,
    y: config.proportionGrouping,
  };

  // Get cell sets under the nodes.
  const cellSets = _.mapValues(cellSetGroupByRoots, (key) => (
    hierarchy.find((rootNode) => rootNode.key === key)?.children
  ));

  if (!cellSets.x || !cellSets.y) {
    return [];
  }

  // eslint-disable-next-line no-shadow
  const cartesian = (...a) => a.reduce((a, b) => a.flatMap((d) => b.map((e) => [d, e].flat())));

  const cellSetCombinations = cartesian(cellSets.x, cellSets.y);

  const plotData = cellSetCombinations.map(([{ key: xCellSetKey }, { key: yCellSetKey }]) => {
    const yCellSet = properties[yCellSetKey];

    const sum = intersection([xCellSetKey, yCellSetKey], properties).size;

    return {
      x: xCellSetKey,
      y: sum,
      yClusterKey: yCellSetKey,
      color: yCellSet.color,
    };
  });

  const yNamesToDisplay = cellSets.y.map(({ key }) => properties[key].name);
  const xNamesToDisplay = cellSets.x.map(({ key }) => properties[key].name);

  return { xNamesToDisplay, yNamesToDisplay, plotData };
};

export {
  generateSpec,
  generateData,
};
