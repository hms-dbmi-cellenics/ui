import React, {
  useRef, useEffect, useState, useCallback,
} from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import {
  Empty, Typography,
} from 'antd';
import _ from 'lodash';
import spec from '../../../utils/heatmapSpec';
import VegaHeatmap from './VegaHeatmap';
import PlatformError from '../../PlatformError';
import { updateCellInfo } from '../../../redux/actions/cellInfo';
import { loadGeneExpression } from '../../../redux/actions/genes';
import { loadCellSets } from '../../../redux/actions/cellSets';
import { loadComponentConfig } from '../../../redux/actions/componentConfig';

import { union } from '../../../utils/cellSetOperations';
import SetOperations from '../../../utils/setOperations';
import Loader from '../../Loader';

const COMPONENT_TYPE = 'interactiveHeatmap';
const { Text } = Typography;

const HeatmapPlot = (props) => {
  const {
    experimentId, width, height,
  } = props;

  const dispatch = useDispatch();

  const loadingGenes = useSelector((state) => state.genes.expression.loading);
  const selectedGenes = useSelector((state) => state.genes.expression.views[COMPONENT_TYPE]?.data);
  const [vegaData, setVegaData] = useState(null);
  const [vegaSpec, setVegaSpec] = useState(spec);

  const expressionData = useSelector((state) => state.genes.expression);
  const hoverCoordinates = useRef({});

  const cellSetsLoading = useSelector((state) => state.cellSets.loading);
  const hierarchy = useSelector((state) => state.cellSets.hierarchy);
  const properties = useSelector((state) => state.cellSets.properties);
  const hidden = useSelector((state) => state.cellSets.hidden);

  const heatmapSettings = useSelector(
    (state) => state.componentConfig[COMPONENT_TYPE]?.config,
  ) || {};

  const {
    selectedTracks, groupedTracks, expressionValue, legendIsVisible,
  } = heatmapSettings;

  const { error } = expressionData;
  const viewError = useSelector((state) => state.genes.expression.views[COMPONENT_TYPE]?.error);

  const [maxCells, setMaxCells] = useState(1000);

  const setDataDebounce = useCallback(_.debounce((data) => {
    setVegaData(data);
  }, 1500, { leading: true }), []);

  /**
   * Loads cell set on initial render if it does not already exist in the store.
   */
  useEffect(() => {
    dispatch(loadCellSets(experimentId));
  }, []);

  useEffect(() => {
    if (!_.isEmpty(heatmapSettings)) {
      return;
    }

    dispatch(loadComponentConfig(experimentId, COMPONENT_TYPE, COMPONENT_TYPE));
  }, [heatmapSettings]);

  useEffect(() => {
    if (hierarchy.length === 0 || cellSetsLoading) {
      return;
    }

    const legends = legendIsVisible ? spec.legends : [];
    setVegaSpec({ ...spec, legends });
  }, [legendIsVisible]);

  useEffect(() => {
    if (!selectedGenes || selectedGenes.length === 0) {
      return;
    }

    if (_.intersection(selectedGenes, loadingGenes).length > 0) {
      setVegaData(null);
      return;
    }

    let trackOrder = [];

    if (selectedTracks) {
      trackOrder = Array.from(selectedTracks).reverse();
    }

    const data = createVegaData(selectedGenes, trackOrder, expressionData);
    setDataDebounce(data);
  }, [loadingGenes,
    hidden,
    selectedTracks,
    groupedTracks,
    maxCells,
    properties,
    hierarchy,
    expressionValue]);

  useEffect(() => {
    setMaxCells(Math.floor(width * 0.8));
  }, [width]);

  const getCellsInSet = (cellSetName) => properties[cellSetName].cellIds;

  const getCellSetIntersections = (cellSet, rootNode) => {
    const cellSetsOfRootNode = rootNode.children.map(({ key }) => getCellsInSet(key));

    const intersectionsSets = [];

    cellSetsOfRootNode.forEach((cellSetOfRootNode) => {
      const currentIntersection = new Set([...cellSet].filter((x) => cellSetOfRootNode.has(x)));

      if (currentIntersection.size > 0) { intersectionsSets.push(currentIntersection); }
    });

    return intersectionsSets;
  };

  const cartesianProductIntersection = (cellSets, rootNode) => {
    const intersectedCellSets = [];

    cellSets.forEach((currentCellSet) => {
      const currentCellSetIntersection = getCellSetIntersections(currentCellSet, rootNode);

      // The cellIds that werent part of any intersection are also added at the end
      const leftOverCellIds = currentCellSetIntersection
        .reduce((acum, current) => SetOperations.difference(acum, current), currentCellSet);

      currentCellSetIntersection.push(leftOverCellIds);

      intersectedCellSets.push(...currentCellSetIntersection);
    });

    return intersectedCellSets;
  };

  // Gets all cells that are in any enabled groupby and not hidden
  const getAllEnabledCellIds = (groupByRootNodes) => {
    let cellIdsInAnyGroupBy = new Set();

    groupByRootNodes.forEach((rootNode) => {
      rootNode.children.forEach(({ key }) => {
        const cellSet = getCellsInSet(key);
        // Union of allCellsInSets and cellSet
        cellIdsInAnyGroupBy = new Set([...cellIdsInAnyGroupBy, ...cellSet]);
      });
    });

    // Only work with non-hidden cells.
    const hiddenCellIds = union(Array.from(hidden), properties);
    const enabledCellIds = new Set([...cellIdsInAnyGroupBy].filter((x) => !hiddenCellIds.has(x)));

    return enabledCellIds;
  };

  const splitByCartesianProductIntersections = (groupByRootNodes) => {
    // Beginning with only one set of all the cells that we want to see
    let buckets = [getAllEnabledCellIds(groupByRootNodes)];

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

  const downsampled = (groupByRootNodes) => {
    const { buckets, size } = splitByCartesianProductIntersections(groupByRootNodes);

    const downsampledCellIds = downsampleWithProportions(buckets, size, groupByRootNodes);

    return downsampledCellIds;
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

    const cellIdsSample = downsampled(groupByRootNodes);

    return cellIdsSample;
  };

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

  const createVegaData = (selected, trackOrder, expression) => {
    // For now, this is statically defined. In the future, these values are
    // controlled from the settings panel in the heatmap.

    const data = {
      cellOrder: [],
      geneOrder: selected,
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

  const handleMouseOver = (...args) => {
    if (args.length < 2) {
      return;
    }

    if ('x' in args[1] && 'y' in args[1]) {
      hoverCoordinates.current = {
        x: args[1].x,
        y: args[1].y,
      };
    }

    if (!args[1].datum) {
      return;
    }

    const { cellId: cellName } = args[1].datum;

    dispatch(
      updateCellInfo(
        {
          cellName,
        },
      ),
    );
  };

  const signalListeners = {
    mouseOver: handleMouseOver,
  };

  if (!selectedGenes || selectedGenes.length === 0) {
    return (
      <Empty description={(
        <Text>Add some genes to this heatmap to get started.</Text>
      )}
      />
    );
  }

  if (!vegaData) {
    return (
      <center style={{ marginTop: height / 2 }}>
        <Loader experimentId={experimentId} />
      </center>
    );
  }

  if (error || viewError) {
    return (
      <PlatformError
        error={error}
        onClick={() => {
          dispatch(loadGeneExpression(experimentId, selectedGenes, COMPONENT_TYPE));
        }}
      />
    );
  }

  return (
    <div>
      <VegaHeatmap
        spec={vegaSpec}
        data={vegaData}
        showAxes={selectedGenes?.length <= 30}
        rowsNumber={selectedGenes.length}
        signalListeners={signalListeners}
        width={width}
        height={height}
      />
    </div>
  );
};

HeatmapPlot.defaultProps = {
};

HeatmapPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

export default HeatmapPlot;

export { HeatmapPlot, COMPONENT_TYPE };
