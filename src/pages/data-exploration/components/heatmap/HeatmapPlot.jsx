import React, { useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Empty, Spin } from 'antd';
import PropTypes from 'prop-types';
import VegaHeatmap from './VegaHeatmap';
import HeatmapCrossHairs from './HeatmapCrossHairs';
import CellInfo from '../CellInfo';
import { updateCellInfo } from '../../../../redux/actions';

const componentType = 'heatmap';

const HeatmapPlot = (props) => {
  const { heatmapWidth } = props;
  const heatmapSpec = useSelector((state) => state.heatmapSpec);
  const geneExpressionData = useSelector((state) => state.geneExpressionData);
  const selectedGenes = useSelector((state) => state.selectedGenes);
  const showAxes = useSelector((state) => state.heatmapSpec?.showAxes);
  const dispatch = useDispatch();

  const hoverCoordinates = useRef({});

  if (!selectedGenes.geneList || Object.keys(selectedGenes.geneList).length === 0) {
    return (
      <center>
        <Empty
          description={(
            <span>
              Please select gene(s) from the Gene list tool
            </span>
          )}
        />
      </center>
    );
  }

  if (geneExpressionData.isLoading || heatmapSpec.rendering) {
    return (<center><Spin size='large' /></center>);
  }

  const handleMouseOver = (...args) => {
    if (args[1].datum) {
      const { cellName, expression, geneName } = args[1].datum;
      dispatch(updateCellInfo({
        cellName, expression, geneName, componentType,
      }));
    }
    if (args[1].x && args[1].y) {
      hoverCoordinates.current = {
        x: args[1].x,
        y: args[1].y,
      };
    }
  };

  const signalListeners = {
    mouseOver: handleMouseOver,
  };

  return [
    <VegaHeatmap
      spec={heatmapSpec}
      showAxes={showAxes}
      rowsNumber={geneExpressionData.data.length || 0}
      defaultWidth={heatmapWidth}
      signalListeners={signalListeners}
    />,
    <HeatmapCrossHairs />,
    <CellInfo
      coordinates={hoverCoordinates}
      componentType={componentType}
    />,
  ];
};

HeatmapPlot.defaultProps = {
};

HeatmapPlot.propTypes = {
  heatmapWidth: PropTypes.number.isRequired,
};

export default HeatmapPlot;
