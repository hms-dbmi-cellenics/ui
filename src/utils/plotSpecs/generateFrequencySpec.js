const generateSpec = (config, plotData) => {
  let legend = [];
  if (config.legend.enabled) {
    legend = [
      {
        fill: 'color',
        title: 'Cell Set',
        titleColor: config.colour.masterColour,
        type: 'symbol',
        orient: config.legend.position,
        offset: 40,
        symbolType: 'square',
        symbolSize: { value: 200 },
        encode: {
          labels: {
            update: {
              text: {
                scale: 'c', field: 'label',
              },
              fill: { value: config.colour.masterColour },
            },
          },
        },
        direction: 'horizontal',
        labelFont: { value: config.fontStyle.font },
        titleFont: { value: config.fontStyle.font },
      },
    ];
  }
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
          {
            type: 'stack',
            groupby: ['x'],
            sort: { field: 'c' },
            field: 'y',
          },
        ],
      },
    ],

    scales: [
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
        domain: { data: 'plotData', field: 'y1' },
      },
      {
        name: 'c',
        type: 'ordinal',
        range: { data: 'plotData', field: 'c' },
        domain: { data: 'plotData', field: 'c' },
      },
      {
        name: 'color',
        type: 'ordinal',
        range: { data: 'plotData', field: 'color' },
        domain: { data: 'plotData', field: 'c' },
      },
    ],

    axes: [
      {
        orient: 'bottom',
        scale: 'x',
        zindex: 1,
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
      },
      {
        orient: 'left',
        scale: 'y',
        zindex: 1,
        gridColor: { value: config.colour.masterColour },
        gridOpacity: { value: (config.axes.gridOpacity / 20) },
        gridWidth: { value: (config.axes.gridWidth / 20) },
        tickColor: { value: config.colour.masterColour },
        offset: { value: config.axes.offset },
        title: { value: config.axes.yAxisText },
        titleFont: { value: config.fontStyle.font },
        labelFont: { value: config.fontStyle.font },
        labelColor: { value: config.colour.masterColour },
        titleFontSize: { value: config.axes.titleFontSize },
        titleColor: { value: config.colour.masterColour },
        labelFontSize: { value: config.axes.labelFontSize },
        domainWidth: { value: config.axes.domainWidth },
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
            fill: { scale: 'color', field: 'c' },
          },
          update: {
            fillOpacity: { value: 1 },
          },
        },
      },
    ],
    legends: legend,
    title:
    {
      text: { value: config.title.text },
      color: { value: config.colour.masterColour },
      anchor: { value: config.title.anchor },
      font: { value: config.fontStyle.font },
      dx: 10,
      fontSize: { value: config.title.fontSize },
    },
  };
};

const generateData = (hierarchy, properties, config) => {
  const calculateSum = (proportionClusters, xAxisClustersIds) => {
    let sum = 0;

    if (!xAxisClustersIds.length) {
      proportionClusters.forEach((cellSetCluster) => {
        sum += properties[cellSetCluster.key].cellIds.size;
      });
      return sum;
    }
    proportionClusters.forEach((cellSetCluster) => {
      const cellSetIds = Array.from(properties[cellSetCluster.key].cellIds);
      sum += xAxisClustersIds.filter((id) => cellSetIds.includes(id)).length;
    });
    return sum;
  };

  const getClustersForGrouping = (name) => hierarchy.filter((cluster) => (
    cluster.key === name))[0]?.children;

  const populateData = (x, y, cluster, sum, data) => {
    let value = y;
    if (config.frequencyType === 'proportional') {
      value = (y / sum) * 100;
    }

    data.push({
      x,
      y: value,
      c: cluster.name,
      color: cluster.color,
    });

    return data;
  };

  let data = [];

  const proportionClusters = hierarchy.filter((cluster) => (
    cluster.key === config.proportionGrouping))[0]?.children;

  if (!proportionClusters) {
    return [];
  }

  const clustersInXAxis = getClustersForGrouping(config.xAxisGrouping);
  if (!clustersInXAxis) {
    const sum = calculateSum(proportionClusters, []);
    proportionClusters.forEach((clusterName) => {
      const x = 1;
      const y = properties[clusterName.key].cellIds.size;
      const cluster = properties[clusterName.key];
      data = populateData(x, y, cluster, sum, data);
    });
  } else {
    clustersInXAxis.forEach((clusterInXAxis) => {
      const clusterInXAxisIds = Array.from(properties[clusterInXAxis.key].cellIds);

      const sum = calculateSum(proportionClusters, clusterInXAxisIds);

      proportionClusters.forEach((clusterName) => {
        const x = properties[clusterInXAxis.key].name;
        const cellSetIds = Array.from(properties[clusterName.key].cellIds);
        const y = clusterInXAxisIds.filter((id) => cellSetIds.includes(id)).length;
        const cluster = properties[clusterName.key];

        if (y !== 0) {
          data = populateData(x, y, cluster, sum, data);
        }
      });
    });
  }

  return data;
};

export {
  generateSpec,
  generateData,
};
