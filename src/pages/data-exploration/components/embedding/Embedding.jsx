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

import { createCellSet } from '../../../../redux/actions/cellSets';
import { loadCells, updateCellInfo } from '../../../../redux/actions';

import {
  renderCellSetColors,
  convertCellsData,
  updateStatus,
  updateViewInfo,
  clearPleaseWait,
  colorByCellClusters,
  colorByGeneExpression,
} from '../../../../utils/embeddingPlotHelperFunctions/helpers';

import legend from '../../../../../static/media/viridis.png';

const _ = require('lodash');

const Scatterplot = dynamic(
  () => import('vitessce/dist/es/production/scatterplot.min.js').then((mod) => mod.Scatterplot),
  { ssr: false },
);

const Embedding = (props) => {
  const { experimentID, embeddingType } = props;
  const uuid = 'my-scatterplot';
  const view = { target: [7, 5, 0], zoom: 4.00 };
  const selectedCellIds = new Set();
  const dispatch = useDispatch();

  const hoverPosition = useRef({ x: 0, y: 0 });
  const [createClusterPopover, setCreateClusterPopover] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const cellSetSelected = useSelector((state) => state.cellSets.selected);
  const cellSetProperties = useSelector((state) => state.cellSets.properties);

  const cells = useSelector((state) => state.cells.data);
  const cellInfo = useSelector((state) => state.cellInfo);
  const focusedGene = useSelector((state) => state.focusedGene);

  useEffect(() => {
    if (!cells) {
      dispatch(loadCells(experimentID, embeddingType));
    }
  }, []);

  if (!cells || focusedGene.isLoading) {
    return (<center><Spin size='large' /></center>);
  }

  const getCellColors = () => {
    if (focusedGene.geneName) {
      return colorByGeneExpression(
        focusedGene.cells,
        focusedGene.expression,
        focusedGene.minExpression,
        focusedGene.maxExpression,
      );
    }
    return renderCellSetColors(cellSetSelected, cellSetProperties);
  };

  const cellColors = getCellColors();

  if (cellInfo.cellName) {
    cellColors[cellInfo.cellName] = [0, 0, 0];
  }

  const updateCellsHover = (cell) => {
    if (cell) {
      if (focusedGene.geneName) {
        const cellPosition = focusedGene.cells.indexOf(cell.cellId);
        if (cellPosition !== -1) {
          const cellExpression = focusedGene.expression[cellPosition];
          return dispatch(updateCellInfo({
            geneName: focusedGene.geneName,
            cellName: cell.cellId,
            expression: cellExpression,
          }));
        }
      }
      return dispatch(updateCellInfo({
        cellName: cell.cellId,
        geneName: undefined,
        expression: undefined,
      }));
    }
  };

  const onCreateCluster = (clusterName, clusterColor) => {
    setCreateClusterPopover(false);
    dispatch(createCellSet(experimentID, clusterName, clusterColor, selectedIds));
  };

  const onCancelCreateCluster = () => {
    setCreateClusterPopover(false);
  };

  const updateCellsSelection = (selection) => {
    setCreateClusterPopover(true);
    setSelectedIds(selection);
  };

  const onMouseUpdate = _.throttle((e) => {
    if (!createClusterPopover) {
      hoverPosition.current = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
    }
  }, 1000);

  return (
    <div
      className='vitessce-container vitessce-theme-light'
      style={{ height: '50vh', position: 'relative' }}
      onMouseMove={(e) => {
        e.persist();
        onMouseUpdate(e);
      }}
    >
      {focusedGene.geneName ? (
        <label htmlFor='gene name'>
          Showing expression for gene:&nbsp;
          <b>{focusedGene.geneName}</b>
        </label>
      ) : <div />}
      <Scatterplot
        cellOpacity={0.1}
        cellRadiusScale={0.1}
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
      {focusedGene.geneName ? (
        <div>
          <img
            src={legend}
            alt='Gene expression Legend'
            style={{
              height: 200, width: 20, position: 'absolute', top: 70,
            }}
          />
        </div>
      ) : <div />}
    </div>
  );
};
Embedding.defaultProps = {};

Embedding.propTypes = {
  experimentID: PropTypes.string.isRequired,
  embeddingType: PropTypes.string.isRequired,
};
export default Embedding;
