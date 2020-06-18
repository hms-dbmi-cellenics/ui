// eslint-disable-file import/no-extraneous-dependencies
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  useSelector, useDispatch,
} from 'react-redux';
import PropTypes from 'prop-types';
import {
  Spin,
} from 'antd';
import 'vitessce/dist/es/production/static/css/index.css';
import ClusterPopover from './ClusterPopover';
import { loadCells, createCluster } from '../../../../redux/actions';

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

  useEffect(() => {
    if (!cells) {
      dispatch(loadCells(experimentID, embeddingType));
    }
  }, []);

  if (!cells) {
    return (<center><Spin size='large' /></center>);
  }

  const hexToRgb = (hex) => {
    if (hex) {
      return hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i,
        (m, r, g, b) => `#${r}${r}${g}${g}${b}${b}`)
        .substring(1).match(/.{2}/g)
        .map((x) => parseInt(x, 16));
    }
    return null;
  };

  const convertCellsData = (results) => {
    const data = {};

    Object.entries(results).forEach(([key, value]) => {
      data[key] = {
        mappings: {
          PCA: value,
        },
      };
    });

    return data;
  };

  const converColorData = () => {
    const colors = {};
    if (colorData) {
      colorData.forEach((cellSet) => {
        const rgbColor = hexToRgb(cellSet.color);
        if (cellSet.cellIds) {
          cellSet.cellIds.forEach((cell) => {
            colors[cell] = rgbColor;
          });
        }
      });
    }

    return colors;
  };

  const onCreateCluster = (clusterName, clusterColor) => {
    setCreateClusterPopover(false);
    dispatch(createCluster(experimentID, selectedIds, clusterName, clusterColor));
  };

  const onCancelCreateCluster = () => {
    setCreateClusterPopover(false);
  };

  const updateCellsHover = () => { };
  const updateCellsSelection = (selection) => {
    setCreateClusterPopover(true);
    setSelectedIds(selection);
  };
  const updateStatus = () => { };
  const updateViewInfo = () => { };
  const clearPleaseWait = () => { };

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
        cellColors={converColorData()}
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
