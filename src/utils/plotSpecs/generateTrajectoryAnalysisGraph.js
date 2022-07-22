/* eslint-disable no-param-reassign */
import _ from 'lodash';
import { getAllCells, getSampleCells } from 'utils/cellSets';

const generateSpec = (config, embeddingData, pathData, cellSetLegendsData) => {
  let legend = [];

  if (config?.legend.enabled) {
    const positionIsRight = config.legend.position === 'right';

    const legendColumns = positionIsRight ? 1 : Math.floor(config.dimensions.width / 85);
    const labelLimit = positionIsRight ? 0 : 85;

    legend = [
      {
        fill: 'cellSetLabelColors',
        title: config?.legend.title || 'Cluster Name',
        titleColor: config?.colour.masterColour,
        type: 'symbol',
        orient: config?.legend.position,
        offset: 40,
        symbolType: 'square',
        symbolSize: 200,
        encode: {
          labels: {
            update: {
              text: {
                scale: 'sampleToName', field: 'label',
              },
              fill: { value: config?.colour.masterColour },
            },

          },
        },
        direction: 'horizontal',
        labelFont: config?.fontStyle.font,
        titleFont: config?.fontStyle.font,
        columns: legendColumns,
        labelLimit,
      },
    ];
  }
  return {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    description: 'Categorical embedding plot',
    width: config?.dimensions.width,
    height: config?.dimensions.height,
    autosize: { type: 'fit', resize: true },
    background: config?.colour.toggleInvert,
    padding: 5,
    signals: [
      {
        name: 'clicked',
        on: [
          {
            events: '@pathNodes:click',
            update: 'datum',
            force: true,
          },
        ],
      },
    ],
    data: [
      {
        name: 'embeddingData',
        values: embeddingData,
        // Vega internally modifies objects during data transforms. If the plot data is frozen,
        // Vega is not able to carry out the transform and will throw an error.
        // https://github.com/vega/vega/issues/2453#issuecomment-604516777
        format: {
          type: 'json',
          copy: true,
        },
      },
      {
        name: 'labels',
        source: 'embeddingData',
        transform: [
          {
            type: 'aggregate', groupby: ['cellSetKey', 'cellSetName'], fields: ['x', 'y'], ops: ['mean', 'mean'], as: ['meanX', 'meanY'],
          },
        ],
      },
      {
        name: 'pathData',
        values: pathData,
        on: [
          {
            trigger: 'clicked',
            modify: 'clicked',
            values: '{ selected: !clicked.selected }',
          },
        ],
      },
    ],
    scales: [
      {
        name: 'x',
        type: 'linear',
        round: true,
        nice: true,
        domain: { data: 'embeddingData', field: 'x' },
        range: 'width',
      },
      {
        name: 'y',
        type: 'linear',
        round: true,
        nice: true,
        zero: true,
        domain: { data: 'embeddingData', field: 'y' },
        range: 'height',
      },
      {
        name: 'cellSetLabelColors',
        type: 'ordinal',
        range: cellSetLegendsData.map(({ color }) => color),
        domain: { data: 'embeddingData', field: 'cellSetKey' },
      },
      {
        name: 'cellSetMarkColors',
        type: 'ordinal',
        range: { data: 'embeddingData', field: 'color' },
        domain: { data: 'embeddingData', field: 'cellSetKey' },
      },
      {
        name: 'sampleToName',
        type: 'ordinal',
        range: cellSetLegendsData.map(({ name }) => name),
      },
    ],
    axes: [
      {
        scale: 'x',
        grid: true,
        domain: true,
        orient: 'bottom',
        title: config?.axes.xAxisText,
        titleFont: config?.fontStyle.font,
        labelFont: config?.fontStyle.font,
        labelColor: config?.colour.masterColour,
        tickColor: config?.colour.masterColour,
        gridColor: config?.colour.masterColour,
        gridOpacity: (config?.axes.gridOpacity / 20),
        gridWidth: (config?.axes.gridWidth / 20),
        offset: config?.axes.offset,
        titleFontSize: config?.axes.titleFontSize,
        titleColor: config?.colour.masterColour,
        labelFontSize: config?.axes.labelFontSize,
        domainWidth: config?.axes.domainWidth,
        labelAngle: config.axes.xAxisRotateLabels ? 45 : 0,
        labelAlign: config.axes.xAxisRotateLabels ? 'left' : 'center',
      },
      {
        scale: 'y',
        grid: true,
        domain: true,
        orient: 'left',
        titlePadding: 5,
        gridColor: config?.colour.masterColour,
        gridOpacity: (config?.axes.gridOpacity / 20),
        gridWidth: (config?.axes.gridWidth / 20),
        tickColor: config?.colour.masterColour,
        offset: config?.axes.offset,
        title: config?.axes.yAxisText,
        titleFont: config?.fontStyle.font,
        labelFont: config?.fontStyle.font,
        labelColor: config?.colour.masterColour,
        titleFontSize: config?.axes.titleFontSize,
        titleColor: config?.colour.masterColour,
        labelFontSize: config?.axes.labelFontSize,
        domainWidth: config?.axes.domainWidth,
      },
    ],
    marks: [
      {
        type: 'symbol',
        from: { data: 'embeddingData' },
        encode: {
          enter: {
            x: { scale: 'x', field: 'x' },
            y: { scale: 'y', field: 'y' },
            size: { value: config?.marker.size },
            stroke: { scale: 'cellSetMarkColors', field: 'cellSetKey' },
            fill: { scale: 'cellSetMarkColors', field: 'cellSetKey' },
            shape: { value: config?.marker.shape },
            fillOpacity: { value: config?.marker.opacity / 10 },
          },
        },
      },
      {
        type: 'text',
        from: { data: 'labels' },
        encode: {
          enter: {
            x: { scale: 'x', field: 'meanX' },
            y: { scale: 'y', field: 'meanY' },
            text: { field: 'cellSetName' },
            fontSize: { value: config?.labels.size },
            strokeWidth: { value: 1.2 },
            fill: { value: config?.colour.masterColour },
            fillOpacity: { value: config?.labels.enabled },
            font: { value: config?.fontStyle.font },
          },
        },
      },
      {
        type: 'line',
        from: { data: 'pathData' },
        encode: {

          enter: {
            x: { scale: 'x', field: 'x' },
            y: { scale: 'y', field: 'y' },
            size: { value: 25 },
            stroke: { value: '#ccc' },
            fillOpacity: { value: 0.2 },
            defined: {
              signal: 'isValid(datum["x"]) && isFinite(+datum["x"]) && isValid(datum["y"]) && isFinite(+datum["y"])',
            },
          },
        },
      },
      {
        type: 'symbol',
        name: 'pathNodes',
        interactive: true,
        from: {
          data: 'pathData',
        },
        encode: {
          update: {
            x: { scale: 'x', field: 'x' },
            y: { scale: 'y', field: 'y' },
            size: { value: 15 },
            stroke: { value: 'black' },
            fill: [
              { test: 'datum.selected', value: 'red' },
              { value: 'white' },
            ],
            shape: { value: 'circle' },
            fillOpacity: { value: 1 },
            defined: {
              signal: 'isValid(datum["x"]) && isFinite(+datum["x"]) && isValid(datum["y"]) && isFinite(+datum["y"])',
            },
          },
        },
      },
    ],
    legends: legend,
    title:
    {
      text: config?.title.text,
      color: config?.colour.masterColour,
      anchor: config?.title.anchor,
      font: config?.fontStyle.font,
      dx: 10,
      fontSize: config?.title.fontSize,
    },
  };
};

const filterCells = (cellSets, sampleKey, groupBy) => {
  let filteredCells = [];

  // Get all the filtered cells
  if (sampleKey === 'All') {
    filteredCells = getAllCells(cellSets, groupBy);
  } else {
    filteredCells = getSampleCells(cellSets, sampleKey);
  }

  // Get the cell set names
  const clusterEnteries = cellSets.hierarchy
    .find(
      (rootNode) => rootNode.key === groupBy,
    )?.children || [];

  const cellSetKeys = clusterEnteries.map(({ key }) => key);

  const colorToCellIdsMap = cellSetKeys.reduce((acc, key) => {
    acc.push({
      cellIds: cellSets.properties[key].cellIds,
      key,
      name: cellSets.properties[key].name,
      color: cellSets.properties[key].color,
    });

    return acc;
  }, []);

  let cellSetLegendsData = [];
  const addedCellSetKeys = new Set();

  filteredCells = filteredCells.reduce((acc, cell) => {
    if (!cell) return acc;

    const inCellSet = colorToCellIdsMap.find((map) => map.cellIds.has(cell.cellId));

    // If cell is not in the cell set, then return
    if (!inCellSet) return acc;

    const { key, name, color } = inCellSet;

    if (!addedCellSetKeys.has(key)) {
      addedCellSetKeys.add(key);
      cellSetLegendsData.push({ key, name, color });
    }

    acc[cell.cellId] = {
      ...cell,
      cellSetKey: key,
      cellSetName: name,
      color,
    };

    return acc;
  }, {});

  // Sort legends to show them in the order that cellSetKeys are stored
  cellSetLegendsData = _.sortBy(
    cellSetLegendsData,
    ({ key }) => _.indexOf(cellSetKeys, key),
  );

  return { filteredCells, cellSetLegendsData };
};

// Filter for nodes that appear later than the current node
const getConnectedNodes = (nodeId, connectedNodes) => {
  const parseNode = (id) => Number.parseInt(id.slice(2), 10);
  const root = parseNode(nodeId);

  const filteredNodes = connectedNodes.map((id) => parseNode(id)).filter((id) => id > root);
  return filteredNodes.map((id) => `Y_${id}`);
};

// Data returned from the trajectory analysis worker is 0 centered
// This has to be remapped onto the embedding
const generateData = (plotData) => {
  const trajectoryNodes = [];

  Object.values(plotData.nodes).forEach((node) => {
    const connectedNodes = getConnectedNodes(node.node_id, node.connected_nodes);

    if (!connectedNodes.length) return;

    connectedNodes.forEach((connectedNodeId) => {
      const connNode = plotData.nodes[connectedNodeId];

      trajectoryNodes.push({ x: node.x, y: node.y, node_id: node.node_id });
      trajectoryNodes.push({ x: connNode.x, y: connNode.y, node_id: connectedNodeId });
      trajectoryNodes.push({ x: null, y: null, node_id: null });
    });
  });

  return trajectoryNodes;
};

export {
  generateSpec,
  generateData,
  filterCells,
};
