import React, { useState } from 'react';
import {
  useSelector, useDispatch,
} from 'react-redux';
import PropTypes from 'prop-types';
import {
  Spin, Popover, Button,
} from 'antd';

// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions
import { Scatterplot } from 'vitessce/build-lib/es/production/scatterplot.min.js';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'vitessce/build-lib/es/production/static/css/index.css';

import EditableField from '../../../components/editable-field/EditableField';
import ColorPicker from '../../../components/color-picker/ColorPicker';

import { loadCells, createCluster } from '../../../actions';

const EmbeddingScatterplot = (props) => {
  const { experimentID, embeddingType } = props;
  const uuid = 'my-scatterplot';
  const view = { target: [0, 0, 0], zoom: 0.75 };
  const mapping = embeddingType.toUpperCase();
  const selectedCellIds = new Set();
  const dispatch = useDispatch();

  // eslint-disable-next-line no-unused-vars
  const updateCellsHover = (hoverInfo) => { };

  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [createClusterPopoup, setCreateClusterPopoup] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [clusterName, setClusterName] = useState('new cluster');
  const [clusterColor, setClusterColor] = useState('#0000FF');

  const handleCreateCluster = () => {
    setCreateClusterPopoup(false);
    dispatch(createCluster(selectedIds, clusterName, clusterColor));
  };


  const renderCellSetPopover = () => {
    const content = (
      <div>
        <EditableField
          defaultText="cluster name"
          onEdit={(e) => {
            setClusterName(e);
          }}
        >
          {clusterName}
        </EditableField>
        <ColorPicker
          color={clusterColor}
          onColorChange={((e) => {
            setClusterColor(e);
          })}
        />
        <div>
          <Button type="primary" size="small" onClick={((e) => handleCreateCluster())}>Create</Button>
          <Button size="small" onClick={((e) => setCreateClusterPopoup(false))}>Cancel</Button>
        </div>
      </div>
    );

    if (createClusterPopoup) {
      return (
        <div style={{ position: 'absolute', left: hoverPosition.x + 20, top: hoverPosition.y + 20 }}>
          <Popover content={content} visible={createClusterPopoup} />
        </div>
      );
    }
  };

  // eslint-disable-next-line no-unused-vars
  const updateCellsSelection = (selection) => {
    setCreateClusterPopoup(true);
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
        if (!createClusterPopoup) {
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
      {renderCellSetPopover()}
    </div>
  );
};
EmbeddingScatterplot.defaultProps = {};

EmbeddingScatterplot.propTypes = {
  experimentID: PropTypes.string.isRequired,
  embeddingType: PropTypes.string.isRequired,
};
export default EmbeddingScatterplot;
