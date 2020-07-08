// eslint-disable-file import/no-extraneous-dependencies
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  useSelector, useDispatch,
} from 'react-redux';
import PropTypes from 'prop-types';
import _ from 'lodash';

import {
  Spin, Button, Empty, Typography,
} from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

import 'vitessce/dist/es/production/static/css/index.css';
import ClusterPopover from './ClusterPopover';

import loadEmbedding from '../../../../redux/actions/embeddings/loadEmbedding';

import { createCellSet } from '../../../../redux/actions/cellSets';
import { updateCellInfo } from '../../../../redux/actions';


import {
  convertCellsData,
  updateStatus,
  updateViewInfo,
  clearPleaseWait,
  renderCellSetColors,
  colorByGeneExpression,
} from '../../../../utils/embeddingPlotHelperFunctions/helpers';

import legend from '../../../../../static/media/viridis.png';

const { Text } = Typography;

const Scatterplot = dynamic(
  () => import('vitessce/dist/es/production/scatterplot.min.js').then((mod) => mod.Scatterplot),
  { ssr: false },
);

const Embedding = (props) => {
  const { experimentId, embeddingType } = props;
  const uuid = 'my-scatterplot';
  const view = { target: [7, 5, 0], zoom: 4.00 };
  const selectedCellIds = new Set();

  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.embeddings[embeddingType]) || {};
  const cellSetSelected = useSelector((state) => state.cellSets.selected);
  const cellSetProperties = useSelector((state) => state.cellSets.properties);
  const selectedCell = useSelector((state) => state.cellInfo.cellName);
  const focusedGene = useSelector((state) => state.focusedGene);

  const hoverPosition = useRef({ x: 0, y: 0 });
  const [createClusterPopover, setCreateClusterPopover] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const [cellColors, setCellColors] = useState({});

  const currentView = useRef();

  useEffect(() => {
    if (!data) {
      dispatch(loadEmbedding(experimentId, embeddingType));
    }
  }, []);

  const getCellColors = (coloringMode) => {
    if (coloringMode === 'expression') {
      return colorByGeneExpression(
        focusedGene.cells,
        focusedGene.expression,
        focusedGene.minExpression,
        focusedGene.maxExpression,
      );
    }

    if (coloringMode === 'cellSet') {
      const colors = renderCellSetColors(cellSetSelected, cellSetProperties);
      return colors;
    }

    return {};
  };

  useEffect(() => {
    if (_.isEmpty(focusedGene) || !focusedGene.expression) {
      return;
    }

    currentView.current = 'expression';
    setCellColors(getCellColors('expression'));
  }, [focusedGene]);

  useEffect(() => {
    console.log('new selection event', cellSetSelected);
    currentView.current = 'cellSet';
    setCellColors(getCellColors('cellSet'));
  }, [cellSetSelected]);

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
    dispatch(createCellSet(experimentId, clusterName, clusterColor, selectedIds));
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

  if (!data || loading || focusedGene.isLoading) {
    return (<center><Spin size='large' /></center>);
  }

  if (error) {
    return (
      <Empty
        image={<Text type='danger'><ExclamationCircleFilled style={{ fontSize: 40 }} /></Text>}
        imageStyle={{
          height: 40,
        }}
        description={
          error
        }
      >
        <Button
          type='primary'
          onClick={() => dispatch(loadEmbedding(experimentId, embeddingType))}
        >
          Try again
        </Button>
      </Empty>
    );
  }

  return (
    <div
      className='vitessce-container vitessce-theme-light'
      style={{ height: '50vh', position: 'relative' }}
      onMouseMove={(e) => {
        e.persist();
        onMouseUpdate(e);
      }}
    >
      {currentView.current === 'expression' ? (
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
        cells={convertCellsData(data)}
        mapping='PCA'
        selectedCellIds={selectedCellIds}
        cellColors={(selectedCell) ? { ...cellColors, [selectedCell]: [0, 0, 0] } : cellColors}
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
      {currentView.current === 'expression' ? (
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
  experimentId: PropTypes.string.isRequired,
  embeddingType: PropTypes.string.isRequired,
};
export default Embedding;
