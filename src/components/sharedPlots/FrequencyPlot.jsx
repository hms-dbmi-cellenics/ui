import React from 'react';
import { Vega } from 'react-vega';
import PropTypes from 'prop-types';

const FrequencyPlot = (props) => {
  const {
    hierarchy, properties, config, actions,
  } = props;

  const generateSpec = () => {
    let legend = [];

    if (config.legend.enabled) {
      legend = [
        {
          fill: 'color',
          title: 'Cell Set',
          titleColor: config.colour.masterColour,
          type: 'symbol',
          orient: config.legend.position,
          offset: config.legend.offset,
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
      autosize: { type: 'fit', resize: false },
      background: config.colour.toggleInvert,
      padding: 5,

      data: [
        {
          name: 'data',
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
          domain: { data: 'data', field: 'x' },
        },
        {
          name: 'y',
          type: 'linear',
          range: 'height',
          nice: true,
          zero: true,
          domain: { data: 'data', field: 'y1' },
        },
        {
          name: 'c',
          type: 'ordinal',
          range: { data: 'data', field: 'c' },
          domain: { data: 'data', field: 'c' },
        },
        {
          name: 'color',
          type: 'ordinal',
          range: { data: 'data', field: 'color' },
          domain: { data: 'data', field: 'c' },
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
          titleFontSize: { value: config.label.titleFontSize },
          titleColor: { value: config.colour.masterColour },
          labelFontSize: { value: config.label.labelFontSize },
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
          titleFontSize: { value: config.label.titleFontSize },
          titleColor: { value: config.colour.masterColour },
          labelFontSize: { value: config.axes.labelFontSize },
          domainWidth: { value: config.axes.domainWidth },
        },
      ],

      marks: [
        {
          type: 'rect',
          from: { data: 'data' },
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

  const calculateSum = (chosenClusters, metadataIds) => {
    let sum = 0;

    if (!metadataIds.length) {
      chosenClusters.forEach((cellSetCluster) => {
        sum += properties[cellSetCluster.key].cellIds.size;
      });
      return sum;
    }
    chosenClusters.forEach((cellSetCluster) => {
      const cellSetIds = Array.from(properties[cellSetCluster.key].cellIds);
      sum += metadataIds.filter((id) => cellSetIds.includes(id)).length;
    });
    return sum;
  };

  const getMetadataClusters = (name) => hierarchy.filter((cluster) => (
    cluster.key === name))[0]?.children;

  const generateData = (spec) => {
    let data = [];

    const chosenClusters = hierarchy.filter((cluster) => (
      cluster.key === config.chosenClusters))[0]?.children;

    if (!chosenClusters) {
      return [];
    }
    const metadataClusters = getMetadataClusters(config.metadata);
    // if no metadata clusters are available
    // a plot is made with the cellset clusters
    if (!metadataClusters) {
      const sum = calculateSum(chosenClusters, []);
      chosenClusters.forEach((clusterName) => {
        const x = 1;
        const y = properties[clusterName.key].cellIds.size;
        const cluster = properties[clusterName.key];
        data = populateData(x, y, cluster, sum, data);
      });
    } else {
      metadataClusters.forEach((metadataCluster) => {
        const metadataIds = Array.from(properties[metadataCluster.key].cellIds);

        const sum = calculateSum(chosenClusters, metadataIds);

        chosenClusters.forEach((clusterName) => {
          const x = properties[metadataCluster.key].name;
          const cellSetIds = Array.from(properties[clusterName.key].cellIds);
          const y = metadataIds.filter((id) => cellSetIds.includes(id)).length;
          const cluster = properties[clusterName.key];

          if (y !== 0) {
            data = populateData(x, y, cluster, sum, data);
          }
        });
      });
    }
    spec.data.forEach((datum) => {
      datum.values = data;
    });
    return data;
  };

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

  const spec = generateSpec();
  generateData(spec);

  return (
    <Vega spec={spec} renderer='canvas' actions={actions} />
  );
};

FrequencyPlot.defaultProps = {
  actions: true,
};

FrequencyPlot.propTypes = {
  hierarchy: PropTypes.object.isRequired,
  properties: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  actions: PropTypes.object,
};

export default FrequencyPlot;
