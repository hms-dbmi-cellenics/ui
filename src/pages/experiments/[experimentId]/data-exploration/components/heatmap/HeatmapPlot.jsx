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
  }, [loadingGenes, hidden]);

  const createVegaData = (selected, expression) => {
    const data = {
      cellOrder: [],
      geneOrder: selected,
      heatmapData: [],
      cellToClusterMap: {},
    };

    // Get all hidden cells
    const hiddenCellIds = union(Array.from(hidden), properties);

    // Downsample cells.
    let totalCellsToShow = 1000;
    const groupByCluster = {};

    const louvainClusters = hierarchy.filter((clusters) => clusters.key === 'louvain');
    if (louvainClusters.length > 0) {
      let totalCellsFetched = 0;

      const clusterKeys = louvainClusters[0].children;

      clusterKeys.forEach(({ key }) => {
        const cellsToShow = Array.from(
          properties[key].cellIds,
        ).filter(
          (id) => !hiddenCellIds.has(id),
        );

        groupByCluster[key] = cellsToShow;
        totalCellsFetched += cellsToShow.length;

        cellsToShow.forEach((cellId) => {
          if (!data.cellToClusterMap[cellId]) {
            data.cellToClusterMap[cellId] = [];
          }

          data.cellToClusterMap[cellId].push(properties[key].color);
        });
      });

      if (totalCellsFetched === 0) {
        return data;
      }

      // We show the number of total cells fetched or the default value,
      // whichever is smaller.
      totalCellsToShow = Math.min(totalCellsToShow, totalCellsFetched);

      // Create a sample of cells to display.
      clusterKeys.forEach(({ key }) => {
        const cells = groupByCluster[key];

        if (!cells) {
          return;
        }

        // Create a sample size proportional to the number of cells to show
        // as well as the number of cells in the cluster.
        const sampleSize = Math.floor(
          (cells.length / totalCellsFetched) * totalCellsToShow,
        );

        data.cellOrder.push(..._.sampleSize(groupByCluster[key], sampleSize));
      });
    }

    // Directly generate heatmap data.
    // eslint-disable-next-line no-shadow
    const cartesian = (...a) => a.reduce((a, b) => a.flatMap((d) => b.map((e) => [d, e].flat())));
    const pairs = cartesian(data.geneOrder, data.cellOrder);

    pairs.forEach(([gene, cellId]) => {
      if (!expression.data[gene]) {
        return;
      }

      data.heatmapData.push({
        cellId,
        gene,
        expression: expression.data[gene].expression[cellId],
      });
    });

    return data;
  };

  const handleMouseOver = (...args) => {
    if (args.length < 2) {
      return;
    }
    if (args[1].datum) {
      const { cellId: cellName, expression, gene: geneName } = args[1].datum;
      dispatch(updateCellInfo({
        cellName, expression, geneName, componentType,
      }));
    }
    if ('x' in args[1] && 'y' in args[1]) {
      hoverCoordinates.current = {
        x: args[1].x,
        y: args[1].y,
      };
    }
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
      <div className='cell-info-container'>
        <CellInfo
          coordinates={hoverCoordinates}
          componentType={componentType}
        />
      </div>
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
