import _ from 'lodash';
import SetOperations from '../../../utils/setOperations';
import { union } from '../../../utils/cellSetOperations';

const populateHeatmapData = (cellSets, config, expression, selectedGenes, downsampling = false) => {
  const { hierarchy, properties, hidden } = cellSets;
  const {
    selectedTracks, groupedTracks, expressionValue,
  } = config;
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
        color,
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
    const louvainClusters = hierarchy.find((clusters) => clusters.key === 'louvain');

    const cellIsInLouvainCluster = getCellsSetInGroup(louvainClusters);

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
    heatmapData: [],
    trackPositionData: [],
    trackGroupData: [],
  };

  // Do downsampling and return cellIds with their order by groupings.
  data.cellOrder = generateCellOrder(groupedTracks);

  // eslint-disable-next-line no-shadow
  const cartesian = (...a) => a.reduce((a, b) => a.flatMap((d) => b.map((e) => [d, e].flat())));

  // Directly generate heatmap data.
  cartesian(
    data.geneOrder, data.cellOrder,
  ).forEach(
    ([gene, cellId]) => {
      const expressionDataForGene = expression.data[gene];

      if (!expressionDataForGene) {
        return;
      }

      const expressionValues = (
        expressionValue === 'raw' ? { color: expressionDataForGene.truncatedExpression.expression, display: expressionDataForGene.rawExpression.expression }
          : expressionValue === 'zScore' ? { color: expressionDataForGene.zScore, display: expressionDataForGene.zScore }
            : undefined
      );

      data.heatmapData.push({
        cellId,
        gene,
        expression: expressionValues.color[cellId],
        displayExpression: expressionValues.display[cellId],
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
