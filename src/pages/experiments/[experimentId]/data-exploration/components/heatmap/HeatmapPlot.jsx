import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import {
  Empty, Spin,
} from 'antd';
import spec from '../../../../../../utils/heatmapSpec';
import VegaHeatmap from './VegaHeatmap';
import HeatmapCrossHairs from './HeatmapCrossHairs';
import CellInfo from '../CellInfo';
import PlatformError from '../../../../../../components/PlatformError';
import { updateCellInfo } from '../../../../../../redux/actions/cellInfo';
import { changeExpressionView } from '../../../../../../redux/actions/genes';

const HeatmapPlot = (props) => {
  const {
    experimentId, width, height,
  } = props;

  const componentType = 'Heatmap';

  const dispatch = useDispatch();
  const selectedGenes = useSelector((state) => state.genes.expression.views[componentType]?.data);
  const selectedGenesLoading = useSelector((state) => state.genes.expression.views[componentType]?.fetching);
  const expressionData = useSelector((state) => state.genes.expression);
  const hoverCoordinates = useRef({});

  const cellSetData = useSelector((state) => state.cellSets);

  const { expressionError: error } = expressionData;
  const viewError = useSelector((state) => state.genes.expression.views[componentType]?.error);

  if (!selectedGenes || selectedGenes.length === 0) {
    return (
      <center>
        <Empty
          description={(
            <span>
              Please select gene(s) from the Gene list tool
            </span>
          )}
        />
        <HeatmapCrossHairs />
      </center>
    );
  }

  if (selectedGenesLoading) {
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
          if (!selectedGenesLoading) {
            dispatch(changeExpressionView(experimentId, selectedGenes, componentType));
          }
        }}
      />
    );
  }

  const createVegaData = () => {
    const data = { cellOrder: [], geneOrder: [], heatmapData: [] };

    data.geneOrder = selectedGenes;

    data.cellOrder = [];

    const louvainClusters = cellSetData.hierarchy.filter((clusters) => clusters.key === 'louvain');
    if (louvainClusters.length > 0) {
      const clusterKeys = louvainClusters[0].children;

      clusterKeys.forEach(({ key }) => {
        data.cellOrder.push(...cellSetData.properties[key].cellIds);
      });
    }

    selectedGenes.forEach((gene) => {
      if (!expressionData.data[gene]) {
        return;
      }

      data.heatmapData.push({
        gene,
        expression: expressionData.data[gene].expression,
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

  return (
    <div>
      <VegaHeatmap
        spec={spec}
        data={createVegaData()}
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
