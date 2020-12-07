import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import {
  Empty, Spin,
} from 'antd';
import _ from 'lodash';
import spec from '../../../../../../utils/heatmapSpec';
import VegaHeatmap from './VegaHeatmap';
import HeatmapCrossHairs from './HeatmapCrossHairs';
import CellInfo from '../CellInfo';
import PlatformError from '../../../../../../components/PlatformError';
import { updateCellInfo } from '../../../../../../redux/actions/cellInfo';
import { loadGeneExpression } from '../../../../../../redux/actions/genes';

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
  const cellSetData = useSelector((state) => state.cellSets);
  const { expressionError: error } = expressionData;
  const viewError = useSelector((state) => state.genes.expression.views[componentType]?.error);

  useEffect(() => {
    if (!selectedGenes || selectedGenes.length === 0) {
      return;
    }

    if (_.intersection(selectedGenes, loadingGenes).length > 0) {
      setVegaData(null);
      return;
    }

    const data = createVegaData(selectedGenes, expressionData);
    setVegaData(data);
  }, [loadingGenes]);

  const createVegaData = (selected, expression) => {
    const data = { cellOrder: [], geneOrder: [], heatmapData: [] };

    data.geneOrder = selected;

    data.cellOrder = [];

    const louvainClusters = cellSetData.hierarchy.filter((clusters) => clusters.key === 'louvain');
    if (louvainClusters.length > 0) {
      const clusterKeys = louvainClusters[0].children;

      clusterKeys.forEach(({ key }) => {
        data.cellOrder.push(...cellSetData.properties[key].cellIds);
      });
    }

    selected.forEach((gene) => {
      if (!expression.data[gene]) {
        return;
      }

      data.heatmapData.push({
        gene,
        expression: expression.data[gene].expression,
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
  };

  if (!selectedGenes || selectedGenes.length === 0) {
    return (
      <center>
        <Empty
          description={(
            <span>
              Please add gene(s) to the heatmap from the Gene list tool
            </span>
          )}
        />
        <HeatmapCrossHairs />
      </center>
    );
  }

  const isHeatmapLoading = () => {
    if (_.intersection(selectedGenes, loadingGenes).length > 0) {
      return true;
    }

    if (!vegaData) {
      return true;
    }

    return false;
  };

  if (isHeatmapLoading()) {
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
          if (!isHeatmapLoading()) {
            dispatch(loadGeneExpression(experimentId, selectedGenes, componentType));
          }
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
        defaultWidth={width + 35}
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
