import React, {
  useRef, useEffect, useState, useCallback,
} from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import {
  Empty, Spin, Typography,
} from 'antd';
import _ from 'lodash';
import spec from '../../../../../../utils/heatmapSpec';
import VegaHeatmap from './VegaHeatmap';
import PlatformError from '../../../../../../components/PlatformError';
import { updateCellInfo } from '../../../../../../redux/actions/cellInfo';
import { loadGeneExpression } from '../../../../../../redux/actions/genes';
import { loadCellSets } from '../../../../../../redux/actions/cellSets';
import { loadComponentConfig } from '../../../../../../redux/actions/componentConfig';

import { union } from '../../../../../../utils/cellSetOperations';

const COMPONENT_TYPE = 'InteractiveHeatmap';
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
    (state) => state.componentConfig.interactiveHeatmap?.config,
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

    dispatch(loadComponentConfig(experimentId, 'interactiveHeatmap', 'interactiveHeatmap'));
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
    // Set sampler rate back to 1000 if the width is large anough.
    if (maxCells < 1000 && width >= 1.2 * maxCells) {
      setMaxCells(1000);
      return;
    }

    // Set rate to an appropriate amount when the container width is below the sample rate.
    if (width <= 1.2 * maxCells) {
      const sampleRate = Math.floor(Math.min(maxCells * (maxCells / width), 1000));
      setMaxCells(sampleRate);
    }
  }, [width]);

  // Defines sorting order according to which group the cell belongs to
  const positionInGrouping = (cellSetNames, cell) => {
    let position = 0;

    for (const { key: cellSetName } of cellSetNames) {
      if (cellsInSet(cellSetName).has(cell)) {
        return position;
      }

      position += 1;
    }

    // If not in grouping set it in the end
    return position + 1;
  };

  const cellsInSet = (cellSetName) => {
    return properties[cellSetName].cellIds;
  };

  ///////////////////////////////////////////////////////////////////////////////////////////
  // Returns a set of all cells relevant to the experiment (so the ones belonging to one or more of the enabled sets and not hidden).
  const getAllRelevantCellIds = (arrayOfcellSetNamesByGroupByKey) => {
    // Find all hidden cells.
    const hiddenCellIds = union(Array.from(hidden), properties);

    let allCellsInSets = new Set();

    Object.values(arrayOfcellSetNamesByGroupByKey).forEach((arrayOfSetNames) => {
      // Add each set of cells into 
      arrayOfSetNames.forEach((setNameObj) => {
        const cellSet = cellsInSet(setNameObj.key);
        // Union of allCellsInSets and cellSet
        allCellsInSets = new Set([...allCellsInSets, ...cellSet]);
      });
    });

    // Only work with non-hidden cells.
    const shownCells = new Set([...allCellsInSets].filter(x => !hiddenCellIds.has(x)));

    return shownCells;
  }

  const getCellSetNamesDict = (rootNodes) => {
    const cellSetNamesByGroupByKey = {};
    rootNodes.forEach((currentRootNode) => cellSetNamesByGroupByKey[currentRootNode.key] = currentRootNode.children);

    return cellSetNamesByGroupByKey
  };

  const downsampled = (cellIds) => {
    // If sample is within maxCells's limit then return original array
    if (cellIds.length <= maxCells) {
      return cellIds;
    }

    let downsampledCellIds = [];

    // Take maxCells amount of cells, picking each one randomly
    for (let i = 0; i < maxCells; i++) {
      var randomIndex = Math.floor(Math.random() * cellIds.length);
      const element = cellIds.splice(randomIndex, 1);

      downsampledCellIds.push(element[0]);
    }

    return downsampledCellIds;
  };

  const downsampleAndSort = (groupByTracks) => {
    // Find the `groupBy` root nodes.
    const groupByRootNodes = 
      groupByTracks
        .map((groupByKey) => {
            return hierarchy.find((cluster) => (cluster.key === groupByKey))
        });

    if (!groupByRootNodes.length) {
      return [];
    }

    // Transform the groupByRootNodes element into a dictionary/object to make its searches by key faster 
    // (this is important since it will be used in the sorting comparator) 
    const cellSetNamesByGroupByKey = getCellSetNamesDict(groupByRootNodes);

    // Get all cellIds from cells that will show up (so those that aren't hidden and are in an enabled groupBy)
    const cellIdsSet = getAllRelevantCellIds(cellSetNamesByGroupByKey);
    const cellIdsArray = Array.from(cellIdsSet);

    const cellIdsSample = downsampled(cellIdsArray);

    const groupingsComparator = (oneCellId, otherCellId) => {
      let onePosition = 0;
      let otherPosition = 0;

      let amountOfGroupings = groupByRootNodes.length;
      let currentGrouping = 0;

      while (onePosition === otherPosition && currentGrouping < amountOfGroupings) {
        onePosition = positionInGrouping(groupByRootNodes[currentGrouping].children, oneCellId);
        otherPosition = positionInGrouping(groupByRootNodes[currentGrouping].children, otherCellId);

        if (onePosition < otherPosition) {
          return -1;
        }

        if (onePosition > otherPosition) {
          return 1;
        }

        currentGrouping += 1;
      }

      return 0;
    }

    const sortedCells = cellIdsSample.sort(groupingsComparator);

    return sortedCells;
  };

  const generateTrackData = (cells, track) => {
    // Find the `groupBy` root node.
    const rootNodes = hierarchy.filter((clusters) => clusters.key === track);

    if (!rootNodes.length) {
      return [];
    }

    let childrenCellSets = [];
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
      <center>
        <Empty
          description={(
            <div>
              <div><Text type='primary'>No expression data to show</Text></div>
              <div><Text type='secondary'>You can add genes to display here from the gene list tool.</Text></div>
            </div>
          )}
        />
      </center>
    );
  }

  if (!vegaData) {
    return (
      <center style={{ marginTop: height / 2 }}>
        <Spin size='large' />
      </center>
    );
  }

  if (error || viewError) {
    console.log('error')
    console.log(error);
    console.log(viewError);
    return (
      <PlatformError
        description={error}
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

export { COMPONENT_TYPE };
