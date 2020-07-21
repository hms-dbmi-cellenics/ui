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
import CrossHair from './CrossHair';
import CellInfo from '../CellInfo';
import loadEmbedding from '../../../../redux/actions/embeddings/loadEmbedding';
import { createCellSet } from '../../../../redux/actions/cellSets';
import { updateCellInfo } from '../../../../redux/actions';
import {
  convertCellsData,
  updateStatus,
  clearPleaseWait,
  renderCellSetColors,
  colorByGeneExpression,
} from '../../../../utils/embeddingPlotHelperFunctions/helpers';
import legend from '../../../../../static/media/viridis.png';
import isBrowser from '../../../../utils/environment';

const { Text } = Typography;

const Scatterplot = dynamic(
  () => import('vitessce/dist/es/production/scatterplot.min.js').then((mod) => mod.Scatterplot),
  { ssr: false },
);

const Embedding = (props) => {
  const { experimentId, embeddingType } = props;
  const view = { target: [7, 5, 0], zoom: 4.00 };
  const selectedCellIds = new Set();

  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.embeddings[embeddingType]) || {};
  const cellSetSelected = useSelector((state) => state.cellSets.selected);
  const loadingColors = useSelector((state) => state.cellSets.loadingColors);
  const cellSetProperties = useSelector((state) => state.cellSets.properties);
  const selectedCell = useSelector((state) => state.cellInfo.cellName);
  const focusedGene = useSelector((state) => state.focusedGene);

  const hoverPosition = useRef({
    x: 0, y: 0,
  });
  const cellCoordintes = useRef({});
  const [createClusterPopover, setCreateClusterPopover] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const [cellColors, setCellColors] = useState({});

  const currentView = useRef();

  useEffect(() => {
    if (!data && isBrowser) {
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
    if (isBrowser) setCellColors(getCellColors('expression'));
  }, [focusedGene]);

  useEffect(() => {
    currentView.current = 'cellSet';
    if (!loadingColors && isBrowser) setCellColors(getCellColors('cellSet'));
  }, [cellSetSelected]);


  const updateCellCoordinates = (newView) => {
    if (createClusterPopover) {
      cellCoordintes.current = {};
    } else if (selectedCell && newView.viewport.project) {
      const [x, y] = newView.viewport.project([data[selectedCell][0], data[selectedCell][1]]);

      cellCoordintes.current = {
        x,
        y,
        width: newView.viewport.width,
        height: newView.viewport.height,
      };
    }
  };

  if (!data || loading || focusedGene.isLoading || loadingColors || !isBrowser) {
    return (<center><Spin size='large' /></center>);
  }

  const updateCellsHover = (cell) => {
    if (cell) {
      if (focusedGene.geneName) {
        const cellIndex = focusedGene.cells.indexOf(parseInt(cell.cellId, 10));
        const cellExpression = focusedGene.expression[cellIndex];
        return dispatch(updateCellInfo({
          geneName: focusedGene.geneName,
          cellName: cell.cellId,
          expression: cellExpression,
          componentType: embeddingType,
        }));
      }
      return dispatch(updateCellInfo({
        cellName: cell.cellId,
        geneName: undefined,
        expression: undefined,
        componentType: embeddingType,
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
      hoverPosition.current = {
        x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY,
      };
    }
  }, 1000);

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
      {currentView.current === 'expression' ? [
        <label htmlFor='gene name'>
          Showing expression for gene:&nbsp;
          <b>{focusedGene.geneName}</b>
        </label>,
        <div>
          <img
            src={legend}
            alt='gene expression legend'
            style={{
              height: 200, width: 20, position: 'absolute', top: 70,
            }}
          />
        </div>,
      ] : <div />}
      <Scatterplot
        cellOpacity={0.1}
        cellRadiusScale={0.1}
        uuid={embeddingType}
        view={view}
        cells={convertCellsData(data)}
        mapping='PCA'
        selectedCellIds={selectedCellIds}
        cellColors={(selectedCell) ? { ...cellColors, [selectedCell]: [0, 0, 0] } : cellColors}
        updateStatus={updateStatus}
        updateCellsSelection={updateCellsSelection}
        updateCellsHover={updateCellsHover}
        updateViewInfo={updateCellCoordinates}
        clearPleaseWait={clearPleaseWait}
      />
      <CrossHair
        componentType={embeddingType}
        coordinates={cellCoordintes}
      />
      <CellInfo
        componentType={embeddingType}
        coordinates={cellCoordintes}
      />
      {
        createClusterPopover
          ? (
            <ClusterPopover
              popoverPosition={hoverPosition}
              onCreate={onCreateCluster}
              onCancel={onCancelCreateCluster}
            />
          ) : <></>
      }
    </div>
  );
};
Embedding.defaultProps = {};

Embedding.propTypes = {
  experimentId: PropTypes.string.isRequired,
  embeddingType: PropTypes.string.isRequired,
};
export default Embedding;
