import React, { useEffect, useState } from 'react';

const populateHeatmapData = (cellSets, config, expression, passedSelectedGenes = null) => {
  const { hierarchy, properties } = cellSets;
  const {
    selectedTracks, groupedTracks, expressionValue,
  } = config;

  const selectedGenes = passedSelectedGenes || config.selectedGenes;
  const [trackOrder] = useState(Array.from(selectedTracks).reverse());

  const generateTrackData = (cells, track) => {
    // Find the `groupBy` root node.
    const rootNodes = hierarchy.filter((clusters) => clusters.key === track);

    if (!rootNodes.length) {
      return [];
    }

    const childrenCellSets = [];
    rootNodes.forEach((rootNode) => childrenCellSets.push(...rootNode.children));

    const trackColorData = [];
    const groupData = [];

    // Iterate over each child node.
    childrenCellSets.forEach(({ key }) => {
      const { cellIds, name, color } = properties[key];

      groupData.push({
        key,
        track,
        name,
        trackName: properties[track].name,
      });

      const intersectionSet = [cellIds, cells].reduce(
        (acc, curr) => new Set([...acc].filter((x) => curr.has(x))),
      );

      intersectionSet.forEach((cellId) => trackColorData.push({
        cellId,
        key,
        track,
        color,
      }));
    });

    return { trackColorData, groupData };
  };

  const downsampleAndSort = (groupByTracks) => {
    // Find the `groupBy` root nodes.

    // About the filtering: If we have failed to find some of the groupbys information,
    // then ignore those (this is useful for groupbys that sometimes dont show up, like 'samples')
    const groupByRootNodes = groupByTracks
      .map((groupByKey) => hierarchy.find((cluster) => (cluster.key === groupByKey)))
      .filter(((track) => track !== undefined));

    if (!groupByRootNodes.length) {
      return [];
    }
    return groupByRootNodes;
  };
  // For now, this is statically defined. In the future, these values are
  // controlled from the settings panel in the heatmap.

  const data = {
    cellOrder: [],
    geneOrder: selectedGenes,
    trackOrder,
    heatmapData: [],
    trackPositionData: [],
    trackGroupData: [],
  };

  // Do downsampling and return cellIds with their order by groupings.
  data.cellOrder = downsampleAndSort(groupedTracks);

  // eslint-disable-next-line no-shadow
  const cartesian = (...a) => a.reduce((a, b) => a.flatMap((d) => b.map((e) => [d, e].flat())));

  // Mapping between expressionValue with key to data
  const dataSource = {
    raw: 'expression',
    zScore: 'zScore',
  };

  // Directly generate heatmap data.
  cartesian(
    data.geneOrder, data.cellOrder,
  ).forEach(
    ([gene, cellId]) => {
      if (!expression.data[gene]) {
        return;
      }

      data.heatmapData.push({
        cellId,
        gene,
        expression: expression.data[gene][dataSource[expressionValue]][cellId],
      });
    },
  );

  // Directly generate track data.
  const trackData = trackOrder.map((rootNode) => generateTrackData(
    new Set(data.cellOrder),
    rootNode,
  ));

  data.trackColorData = trackData.map((datum) => datum.trackColorData).flat();
  data.trackGroupData = trackData.map((datum) => datum.groupData).flat();

  return data;
};
export default populateHeatmapData;
