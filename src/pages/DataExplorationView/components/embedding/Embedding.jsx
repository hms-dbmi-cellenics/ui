// eslint-disable-file import/no-extraneous-dependencies
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  useSelector, useDispatch,
} from 'react-redux';
import PropTypes from 'prop-types';
import {
  Spin,
} from 'antd';
import 'vitessce/build-lib/es/production/static/css/index.css';
import ClusterPopover from './ClusterPopover';
import { loadCells, createCluster } from '../../../../redux/actions';

const Scatterplot = dynamic(
  () => import('vitessce/build-lib/es/production/scatterplot.min.js').then((mod) => mod.Scatterplot),
  { ssr: false },
);

const Embedding = (props) => {
  const { experimentID, embeddingType } = props;
  const uuid = 'my-scatterplot';
  const view = { target: [0, 0, 0], zoom: 0.75 };
  const mapping = embeddingType.toUpperCase();
  const selectedCellIds = new Set();
  const dispatch = useDispatch();

  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [createClusterPopover, setCreateClusterPopover] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const cells = useSelector((state) => state.cells.data);
  const colorData = useSelector((state) => state.cellSetsColor.data);

  const getEmbeddingRequest = {
    name: 'GetEmbedding',
    type: embeddingType,
  };

  useEffect(() => {
    if (!cells) {
      dispatch(loadCells(experimentID, getEmbeddingRequest));
    }
  });

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
        cellSet.cellIds.forEach((cell) => {
          colors[cell] = rgbColor;
        });
      });
    }

    return colors;
  };

  const onCreateCluster = (clusterName, clusterColor) => {
    setCreateClusterPopover(false);
    dispatch(createCluster(selectedIds, clusterName, clusterColor));
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

  return (
    <div
      className='vitessce-container vitessce-theme-light'
      style={{ height: '50vh', position: 'relative' }}
      onMouseMove={(e) => {
        if (!createClusterPopover) {
          setHoverPosition({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
        }
      }}
    >
      <Scatterplot
        uuid={uuid}
        view={view}
        cells={convertCellsData(cells)}
        mapping={mapping}
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
            popoverPosition={hoverPosition}
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
