import _ from 'lodash';
import generateVitessceHeatmapTracksData from 'components/plots/helpers/heatmap/generateVitessceHeatmapTracksData';

import generateVegaGeneExpressionsData from 'components/plots/helpers/heatmap/generateVegaHeatmapGeneExpressionsData';
import generateVegaHeatmapTracksData from 'components/plots/helpers/heatmap/generateVegaHeatmapTracksData';

import SetOperations from 'utils/setOperations';
import { union } from 'utils/cellSetOperations';

const populateHeatmapData = (
  cellSets, heatmapSettings, expression,
  selectedGenes, downsampling = false, vitessce = false,
) => {
  const { hierarchy, properties, hidden } = cellSets;
  const { selectedTracks, groupedTracks } = heatmapSettings;

  const maxCells = 1000;
  const getCellsInSet = (cellSetName) => properties[cellSetName].cellIds;

  // return a set with all the cells found in group node
  // e.g: node = {key: louvain, children: []}, {...}

  const getCellsSetInGroup = (node) => {
    let cellIdsInAnyGroupBy = new Set();

    node.children.forEach(({ key }) => {
      const cellSet = getCellsInSet(key);
      // Union of allCellsInSets and cellSet
      cellIdsInAnyGroupBy = new Set([...cellIdsInAnyGroupBy, ...cellSet]);
    });
    return cellIdsInAnyGroupBy;
  };

  const trackOrder = Array.from(selectedTracks).reverse();

  const downsampleWithProportions = (buckets, cellIdsLength) => {
    const downsampledCellIds = [];

    // If we collected less than `max` number of cells, let's go with that.
    const finalSampleSize = Math.min(cellIdsLength, maxCells);

    buckets.forEach((bucket) => {
      const sampleSize = Math.floor(
        (bucket.size / cellIdsLength) * finalSampleSize,
      );

      downsampledCellIds.push(..._.sampleSize(Array.from(bucket), sampleSize));
    });

    return downsampledCellIds;
  };

  const getCellSetIntersections = (cellSet, rootNode) => {
    const cellSetsOfRootNode = rootNode.children.map(({ key }) => getCellsInSet(key));
    const intersectionsSets = [];

    cellSetsOfRootNode.forEach((cellSetOfRootNode) => {
      const currentIntersection = new Set([...cellSet].filter((x) => cellSetOfRootNode.has(x)));

      if (currentIntersection.size > 0) { intersectionsSets.push(currentIntersection); }
    });

    return intersectionsSets;
  };

  const cartesianProductIntersection = (buckets, rootNode) => {
    const intersectedCellSets = [];

    buckets.forEach((currentCellSet) => {
      const currentCellSetIntersection = getCellSetIntersections(currentCellSet, rootNode);

      // The cellIds that werent part of any intersection are also added at the end
      const leftOverCellIds = currentCellSetIntersection
        .reduce((acum, current) => SetOperations.difference(acum, current), currentCellSet);

      currentCellSetIntersection.push(leftOverCellIds);

      intersectedCellSets.push(...currentCellSetIntersection);
    });

    return intersectedCellSets;
  };
  const getAllEnabledCellIds = () => {
    // we want to avoid displaying elements which are not in a louvain cluster
    // so initially consider as enabled only cells in louvain clusters
    // See: https://biomage.atlassian.net/browse/BIOMAGE-809
    const selectedCellSet = heatmapSettings?.selectedCellSet ? heatmapSettings.selectedCellSet : 'louvain';
    const selectedClusters = hierarchy.find(
      (clusters) => clusters.key === selectedCellSet,
    );
    const cellIsInLouvainCluster = getCellsSetInGroup(selectedClusters);

    // Remove cells from groups marked as hidden by the user in the UI.
    const hiddenCellIds = union(Array.from(hidden), properties);
    const enabledCellIds = new Set([...cellIsInLouvainCluster]
      .filter((cellId) => !hiddenCellIds.has(cellId)));

    return enabledCellIds;
  };

  const splitByCartesianProductIntersections = (groupByRootNodes) => {
    // Beginning with only one set of all the cells that we want to see
    let buckets = [getAllEnabledCellIds()];

    // Perform successive cartesian product intersections across each groupby
    groupByRootNodes.forEach((currentRootNode) => {
      buckets = cartesianProductIntersection(
        buckets,
        currentRootNode,
      );
    });

    // We need to calculate size at the end because we may have repeated cells
    // (due to group bys having the same cell in different groups)
    const size = buckets.reduce((acum, currentBucket) => acum + currentBucket.size, 0);

    return { buckets, size };
  };

  const generateCellOrder = (groupByTracks) => {
    // Find the `groupBy` root nodes.

    // About the filtering: If we have failed to find some of the groupbys information,
    // then ignore those (this is useful for groupbys that sometimes dont show up, like 'samples')
    const groupByRootNodes = groupByTracks
      .map((groupByKey) => hierarchy.find((cluster) => (cluster.key === groupByKey)))
      .filter(((track) => track !== undefined));

    if (!groupByRootNodes.length) {
      return [];
    }
    const { buckets, size } = splitByCartesianProductIntersections(groupByRootNodes);

    if (downsampling) {
      return downsampleWithProportions(buckets, size);
    }

    const cellIds = [];
    buckets.forEach((bucket) => {
      cellIds.push(...bucket);
    });

    return cellIds;
  };
  // For now, this is statically defined. In the future, these values are
  // controlled from the settings panel in the heatmap.

  const data = {
    cellOrder: [],
    geneOrder: selectedGenes,
    trackOrder,
    geneExpressionsData: [],
    trackPositionData: [],
    trackGroupData: [],
  };

  // Do downsampling and return cellIds with their order by groupings.
  data.cellOrder = generateCellOrder(groupedTracks);

  data.geneExpressionsData = generateVegaGeneExpressionsData(data, expression, heatmapSettings);

  const cells = new Set(data.cellOrder);

  // Directly generate track data.
  if (!vitessce) {
    const trackData = trackOrder.map((rootNode) => generateVegaHeatmapTracksData(
      cells,
      rootNode,
      cellSets,
      heatmapSettings,
    ));

    data.trackColorData = trackData.map((datum) => datum.trackColorData).flat();
    data.trackGroupData = trackData.map((datum) => datum.groupData).flat();
    data.clusterSeparationLines = trackData.length > 0 ? trackData[0].clusterSeparationLines : [];
  } else {
    data.trackColorData = generateVitessceHeatmapTracksData(
      trackOrder, cellSets.hierarchy, cellSets.properties, cells,
    );
  }

  return data;
};
export default populateHeatmapData;
