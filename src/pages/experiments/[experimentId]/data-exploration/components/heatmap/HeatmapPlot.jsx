import React, {
  useRef, useEffect, useState, useCallback,
} from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import {
  Empty, Spin, Typography,
} from 'antd';
import _ from 'lodash';
import { RightOutlined } from '@ant-design/icons';
import spec from '../../../../../../utils/heatmapSpec';
import VegaHeatmap from './VegaHeatmap';
import HeatmapCrossHairs from './HeatmapCrossHairs';
import CellInfo from '../CellInfo';
import PlatformError from '../../../../../../components/PlatformError';
import { updateCellInfo } from '../../../../../../redux/actions/cellInfo';
import { loadGeneExpression } from '../../../../../../redux/actions/genes';

import { union } from '../../../../../../utils/cellSetOperations';

const { Text } = Typography;

const HeatmapPlot = (props) => {
  const {
    experimentId, width, height,
  } = props;

  const componentType = 'Heatmap';

  const dispatch = useDispatch();

  const loadingGenes = useSelector((state) => state.genes.expression.loading);
  const selectedGenes = useSelector((state) => state.genes.expression.views[componentType]?.data);
  const [vegaData, setVegaData] = useState(null);

  const expressionData = useSelector((state) => state.genes.expression);
  const hoverCoordinates = useRef({});

  const hierarchy = useSelector((state) => state.cellSets.hierarchy);
  const properties = useSelector((state) => state.cellSets.properties);
  const hidden = useSelector((state) => state.cellSets.hidden);

  const { error } = expressionData;
  const viewError = useSelector((state) => state.genes.expression.views[componentType]?.error);

  const setDataDebounce = useCallback(_.debounce((data) => {
    setVegaData(data);
  }, 1500, { leading: true }), []);

  useEffect(() => {
    if (!selectedGenes || selectedGenes.length === 0) {
      return;
    }

    if (_.intersection(selectedGenes, loadingGenes).length > 0) {
      setVegaData(null);
      return;
    }

    const data = createVegaData(selectedGenes, expressionData);
    setDataDebounce(data);
  }, [loadingGenes, hidden, properties, hierarchy]);

  const downsample = (groupBy, max = 1000) => {
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
    const finalSampleSize = Math.min(total, max);

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

  const createVegaData = (selected, expression) => {
    // For now, this is statically defined. In the future, these values are
    // controlled from the settings panel in the heatmap.
    const trackOrder = ['louvain'];
    const groupBy = 'louvain';

    const data = {
      cellOrder: [],
      geneOrder: selected,
      trackOrder,
      heatmapData: [],
      trackPositionData: [],
      trackGroupData: [],
    };

    // Do downsampling.
    data.cellOrder = downsample(groupBy);

    // eslint-disable-next-line no-shadow
    const cartesian = (...a) => a.reduce((a, b) => a.flatMap((d) => b.map((e) => [d, e].flat())));

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
          expression: expression.data[gene].expression[cellId],
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

    console.log(data);

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
    width: (e) => console.warn(e),
    height: (e) => console.warn(e),
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
        <HeatmapCrossHairs />
      </center>
    );
  }

  if (!vegaData) {
    return (
      <center style={{ marginTop: height / 2 }}>
        <Spin size='large' />
        <HeatmapCrossHairs />
      </center>
    );
  }

  if (error || viewError) {
    return (
      <PlatformError
        description={error}
        onClick={() => {
          dispatch(loadGeneExpression(experimentId, selectedGenes, componentType));
        }}
      />
    );
  }

  return (
    <div>
      <VegaHeatmap
        spec={spec}
        data={vegaData}
        showAxes={selectedGenes?.length <= 30}
        rowsNumber={selectedGenes.length}
        signalListeners={signalListeners}
        width={width}
        height={height}
      />

      <HeatmapCrossHairs />
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
