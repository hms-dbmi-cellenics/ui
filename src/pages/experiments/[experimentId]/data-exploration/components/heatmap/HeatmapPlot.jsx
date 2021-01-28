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
    selectedTracks, groupedTrack, expressionValue, legendIsVisible,
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
    groupedTrack,
    maxCells,
    properties,
    hierarchy,
    expressionValue]);

  useEffect(() => {
    setMaxCells(Math.floor(width * 0.8));
  }, [width]);

  const downsample = (groupBy) => {
    // Find all hidden cells.
    const hiddenCellIds = union(Array.from(hidden), properties);

    // Get how many cells we are sampling.
    let total = 0;

    // Create an object for storing the cells grouped by `groupBy`.
    const groupedCells = {};

    // Find the `groupBy` root node.
    const rootNode = hierarchy.filter((clusters) => clusters.key === groupBy);

    if (!rootNode.length) {
      return [];
    }

    const { children } = rootNode[0];

    // Iterate over each child node.
    children.forEach(({ key }) => {
      // Only work with non-hidden cells.
      const shownCells = Array.from(
        properties[key].cellIds,
      ).filter(
        (id) => !hiddenCellIds.has(id),
      );

      total += shownCells.length;

      groupedCells[key] = shownCells;
    });

    // If we collected less than `max` number of cells, let's go with that.
    const finalSampleSize = Math.min(total, maxCells);

    if (total === 0) {
      return [];
    }

    // Create a sample of cells to display.
    const sample = [];

    children.forEach(({ key }) => {
      const cells = groupedCells[key];

      if (!cells) {
        return;
      }

      // Create a sample size proportional to the number of cells to show
      // as well as the number of cells in the cluster.
      const sampleSize = Math.floor(
        (cells.length / total) * finalSampleSize,
      );

      sample.push(..._.sampleSize(cells, sampleSize));
    });

    return sample;
  };

  const generateTrackData = (cells, track) => {
    // Find the `groupBy` root node.
    const rootNode = hierarchy.filter((clusters) => clusters.key === track);

    if (!rootNode.length) {
      return [];
    }

    const { children } = rootNode[0];

    const trackColorData = [];
    const groupData = [];

    // Iterate over each child node.
    children.forEach(({ key }) => {
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

    // Do downsampling.
    data.cellOrder = downsample(groupedTrack);

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
