import _ from 'lodash';

import { intersection } from '../cellSetOperations';

const paddingSize = 5;

const generateSpec = (config, plotData, xNamesToDisplay, yNamesToDisplay) => {
  const frequencyProportional = config.frequencyType === 'proportional';
  const yAutoDomain = frequencyProportional ? [0, 100] : { data: 'plotData', field: 'y1' };
  const yManualMax = frequencyProportional
    ? Math.min(config.axesRanges.yMax, 100)
    : config.axesRanges.yMax;

  const yScaleDomain = config.axesRanges.yAxisAuto
    ? yAutoDomain
    : [Math.max(config.axesRanges.yMin, 0), yManualMax];

  let legend = [];
  let plotDataReversed = [];
  if (config.legend.enabled) {
    const positionIsRight = config.legend.position === 'right';
    plotDataReversed = plotData.slice().reverse();

    // Approximate the size of each name.
    // All names can have that size or less, so can use it calculate the amount of columns
    //
    // The size of each name is calculated by getting the amount of chars in
    //  each name and multiplying by each approx char size, 5.5
    //  plus 30 for the color symbol and offset
    const colorSymbolSize = 30;
    const characterSizeHorizontal = 5.5;
    const characterSizeVertical = 16;
    const xTickSize = 140;
    const maxLegendItemsPerCol = Math.floor(
      (config.dimensions.height - xTickSize - (2 * paddingSize))
      / characterSizeVertical,
    );

    const legendSize = colorSymbolSize + _.max(
      yNamesToDisplay.map((legendName) => legendName.length * characterSizeHorizontal),
    );

    const legendColumns = positionIsRight
      ? Math.ceil(yNamesToDisplay.length / maxLegendItemsPerCol)
      : Math.floor((config.dimensions.width) / legendSize);
    const labelLimit = positionIsRight ? 0 : legendSize;

    legend = [
      {
        fill: positionIsRight ? 'cellSetColorsReversed' : 'cellSetColors',
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
                scale: positionIsRight ? 'yCellSetKeyReversed' : 'yCellSetKey',
                field: 'label',
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
        symbolLimit: 0,
      },

    ];
  }

  return {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    description: 'Frequency plot',
    width: config.dimensions.width,
    height: config.dimensions.height,
    autosize: { type: 'fit', resize: true },
    background: config.colour.toggleInvert,
    padding: paddingSize,

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
        transform: [
          {
            type: 'stack',
            groupby: ['x'],
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
        zero: false,
        domain: yScaleDomain,
      },
      {
        name: 'yCellSetKey',
        type: 'ordinal',
        range: yNamesToDisplay,
      },
      {
        name: 'cellSetColors',
        type: 'ordinal',
        range: plotData.map(({ color }) => color),
        domain: { data: 'plotData', field: 'yCellSetKey' },
      },
      {
        name: 'cellSetColorsReversed',
        type: 'ordinal',
        range: plotDataReversed.map(({ color }) => color),
        domain: { data: 'plotData', field: 'yCellSetKey' },
      },
      {
        name: 'yCellSetKeyReversed',
        type: 'ordinal',
        range: yNamesToDisplay.slice().reverse(),
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
        name: 'bounding-group',
        type: 'group',
        encode: {
          update: {
            width: { signal: 'width ' },
            height: { signal: 'height' },
            clip: { value: true },
          },
        },
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
                fill: { scale: 'cellSetColors', field: 'yCellSetKey' },
              },
              update: {
                fillOpacity: 1,
              },
            },
          },
        ],
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
    hierarchy.find((rootNode) => rootNode.key === key)?.children || []
  ));

  if (!cellSets.x || !cellSets.y) {
    return [];
  }

  const totalYDict = {};

  if (config.frequencyType === 'proportional') {
    // Get the total number of cells in each cell set.
    cellSets.x.forEach((xCellSet, indx) => {
      let total = 0;
      const xCellSetIds = Array.from(properties[xCellSet.key].cellIds);

      cellSets.y.forEach((yCellSet) => {
        const yCellSetIds = properties[yCellSet.key].cellIds;
        total += xCellSetIds.filter((id) => yCellSetIds.has(id)).length;
      });

      totalYDict[cellSets.x[indx].key] = total;
    });
  }

  // eslint-disable-next-line no-shadow
  const cartesian = (...a) => a.reduce((a, b) => a.flatMap((d) => b.map((e) => [d, e].flat())));

  const cellSetCombinations = cartesian(cellSets.x, cellSets.y);

  const plotData = cellSetCombinations.map(([{ key: xCellSetKey }, { key: yCellSetKey }]) => {
    const yCellSet = properties[yCellSetKey];
    const sum = intersection([xCellSetKey, yCellSetKey], properties).size;

    let y = sum;
    if (config.frequencyType === 'proportional') {
      const { key } = cellSets.x.filter((xCellSet) => xCellSet.key === xCellSetKey)[0];
      const totalY = totalYDict[key];
      y = ((sum / totalY) * 100).toFixed(3);
    }

    return {
      x: xCellSetKey,
      y,
      yCellSetKey,
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
