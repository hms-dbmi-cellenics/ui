// eslint-disable-file import/no-extraneous-dependencies
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  useSelector, useDispatch,
} from 'react-redux';
import PropTypes from 'prop-types';
import { Spin } from 'antd';
import 'vitessce/dist/es/production/static/css/index.css';
import ClusterPopover from './ClusterPopover';
import { loadCells, createCluster, updateCellInfo } from '../../../../redux/actions';
import {
  convertColorData,
  convertCellsData,
  updateStatus,
  updateViewInfo,
  clearPleaseWait,
} from '../../../../utils/embeddingPlotHelperFunctions/helpers';

const _ = require('lodash');

const Scatterplot = dynamic(
  () => import('vitessce/dist/es/production/scatterplot.min.js').then((mod) => mod.Scatterplot),
  { ssr: false },
);

const Embedding = (props) => {
  const { experimentID, embeddingType } = props;
  const uuid = 'my-scatterplot';
  const view = { target: [0, 0, 0], zoom: 0.75 };
  const selectedCellIds = new Set();
  const dispatch = useDispatch();

  const hoverPosition = useRef({ x: 0, y: 0 });
  const [createClusterPopover, setCreateClusterPopover] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const cells = useSelector((state) => state.cells.data);
  const colorData = useSelector((state) => state.cellSetsColor.data);
  const cellInfo = useSelector((state) => state.cellInfo);

  useEffect(() => {
    if (!cells) {
      dispatch(loadCells(experimentID, embeddingType));
    }
  }, []);

  if (!cells) {
    return (<center><Spin size='large' /></center>);
  }

  const cellColors = convertColorData(colorData);
  if (cellInfo.cellName) {
    cellColors[cellInfo.cellName] = [30, 30, 30];
  }

  const updateCellsHover = (cell) => {
    if (cell) {
      dispatch(updateCellInfo({
        cellName: cell.cellId,
      }));
    }
  };

  const onCreateCluster = (clusterName, clusterColor) => {
    setCreateClusterPopover(false);
    dispatch(createCluster(experimentID, selectedIds, clusterName, clusterColor));
  };

  const onCancelCreateCluster = () => {
    setCreateClusterPopover(false);
  };

  const updateCellsSelection = (selection) => {
    setCreateClusterPopover(true);
    setSelectedIds(selection);
  };

  const updateCursorPosition = (e) => {
    if (!createClusterPopover) {
      hoverPosition.current = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
    }
  };

  const onMouseUpdate = _.throttle(updateCursorPosition, 1000);

  return (
    <div
      className='vitessce-container vitessce-theme-light'
      style={{ height: '50vh', position: 'relative' }}
      onMouseMove={(e) => {
        e.persist();
        onMouseUpdate(e);
      }}
    >
      <Scatterplot
        uuid={uuid}
        view={view}
        cells={convertCellsData(cells)}
        mapping='PCA'
        selectedCellIds={selectedCellIds}
        cellColors={cellColors}
        updateStatus={updateStatus}
        updateCellsSelection={updateCellsSelection}
        updateCellsHover={updateCellsHover}
        updateViewInfo={updateViewInfo}
        clearPleaseWait={clearPleaseWait}
      />
      {createClusterPopover
        ? (
          <ClusterPopover
            popoverPosition={hoverPosition.current}
            onCreate={onCreateCluster}
            onCancel={onCancelCreateCluster}
          />
        ) : <></>}
    </div>
  );
};
Embedding.defaultProps = {};

Embedding.propTypes = {
  experimentID: PropTypes.string.isRequired,
  embeddingType: PropTypes.string.isRequired,
};
export default Embedding;
