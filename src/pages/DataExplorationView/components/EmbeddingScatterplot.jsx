import React from 'react';
import {
  useSelector, useDispatch,
} from 'react-redux';
import PropTypes from 'prop-types';

// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions
import { Scatterplot } from 'vitessce/build-lib/es/production/scatterplot.min.js';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'vitessce/build-lib/es/production/static/css/index.css';

import { Spin } from 'antd';
import { loadCells } from '../../../actions';

const EmbeddingScatterplot = (props) => {
  const { experimentID } = props;
  const uuid = 'my-scatterplot';
  const view = { target: [0, 0, 0], zoom: 0.75 };
  const mapping = 'PCA';
  const selectedCellIds = new Set();
  // eslint-disable-next-line no-unused-vars
  const updateCellsHover = (hoverInfo) => { };
  // eslint-disable-next-line no-unused-vars
  const updateCellsSelection = (selectedIds) => { console.warn(selectedIds); };
  // eslint-disable-next-line no-unused-vars
  const updateStatus = (message) => { };
  // eslint-disable-next-line no-unused-vars
  const updateViewInfo = (viewInfo) => { };
  // eslint-disable-next-line no-unused-vars
  const clearPleaseWait = (layerName) => { };

  const dispatch = useDispatch();
  const cells = useSelector((state) => state.cells.data);
  const colorData = useSelector((state) => state.cellSetsColor.data);

  const requestBody = {
    name: 'GetEmbedding',
    type: 'pca',
  };

  dispatch(loadCells(experimentID, requestBody));

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
    <div className="vitessce-container vitessce-theme-light" style={{ height: '50vh', position: 'relative' }}>
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
    </div>
  );
};
EmbeddingScatterplot.defaultProps = {};

EmbeddingScatterplot.propTypes = {
  experimentID: PropTypes.string.isRequired,
};
export default EmbeddingScatterplot;
