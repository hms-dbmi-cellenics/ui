import React, { useState } from 'react';
import {
  useSelector, useDispatch,
} from 'react-redux';
import PropTypes from 'prop-types';
import {
  Spin,
} from 'antd';

// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions
import { Scatterplot } from 'vitessce/build-lib/es/production/scatterplot.min.js';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'vitessce/build-lib/es/production/static/css/index.css';
import ClusterPopover from './ClusterPopover';

import { loadCells } from '../../../actions';

const EmbeddingScatterplot = (props) => {
  const { experimentID, embeddingType } = props;
  const uuid = 'my-scatterplot';
  const view = { target: [0, 0, 0], zoom: 0.75 };
  const mapping = embeddingType.toUpperCase();
  const selectedCellIds = new Set();
  const dispatch = useDispatch();

  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [createClusterPopover, setCreateClusterPopover] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // eslint-disable-next-line no-unused-vars
  const updateCellsHover = (hoverInfo) => { };

  // eslint-disable-next-line no-unused-vars
  const updateCellsSelection = (selection) => {
    setCreateClusterPopover(true);
    setSelectedIds(selection);
  };
  // eslint-disable-next-line no-unused-vars
  const updateStatus = (message) => { };
  // eslint-disable-next-line no-unused-vars
  const updateViewInfo = (viewInfo) => { };
  // eslint-disable-next-line no-unused-vars
  const clearPleaseWait = (layerName) => { };

  const cells = useSelector((state) => state.cells.data);
  const colorData = useSelector((state) => state.cellSetsColor.data);

  const getEmbeddingRequest = {
    name: 'GetEmbedding',
    type: embeddingType,
  };

  dispatch(loadCells(experimentID, getEmbeddingRequest));

  if (cells == null) {
    return (<center><Spin size="large" /></center>);
  }

  const convertData = (results) => {
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

  const hexToRgb = (hex) => {
    if (hex) {
      return hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i,
        (m, r, g, b) => `#${r}${r}${g}${g}${b}${b}`)
        .substring(1).match(/.{2}/g)
        .map((x) => parseInt(x, 16));
    }
    return null;
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

  return (
    <div
      className="vitessce-container vitessce-theme-light"
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
        cells={convertData(cells)}
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
        ? <ClusterPopover hoverPosition={hoverPosition} cellIds={selectedIds} /> : <></>}
    </div>
  );
};
EmbeddingScatterplot.defaultProps = {};

EmbeddingScatterplot.propTypes = {
  experimentID: PropTypes.string.isRequired,
  embeddingType: PropTypes.string.isRequired,
};
export default EmbeddingScatterplot;
