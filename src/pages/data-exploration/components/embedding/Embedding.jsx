// eslint-disable-file import/no-extraneous-dependencies
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  useSelector, useDispatch,
} from 'react-redux';
import PropTypes from 'prop-types';
import {
  Spin, Button, Empty, Typography,
} from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import 'vitessce/dist/es/production/static/css/index.css';
import ClusterPopover from './ClusterPopover';
import CrossHair from './CrossHair';
import CellInfo from '../CellInfo';
import loadEmbedding from '../../../../redux/actions/loadEmbedding';
import { createCellSet } from '../../../../redux/actions/cellSets';
import { loadGeneExpression } from '../../../../redux/actions/genes';

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
  const view = { target: [6, 9, 0], zoom: 4.00 };
  const selectedCellIds = new Set();

  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.embeddings[embeddingType]) || {};
  const cellSetSelected = useSelector((state) => state.cellSets.selected);
  const loadingColors = useSelector((state) => state.cellSets.loadingColors);
  const cellSetProperties = useSelector((state) => state.cellSets.properties);
  const selectedCell = useSelector((state) => state.cellInfo.cellName);

  const focusedGene = useSelector((state) => state.genes.focused);
  const expressionLoading = useSelector((state) => state.genes.expression.loading);
  const focusedExpression = useSelector((state) => state.genes.expression.data[focusedGene]);
  const cellCoordintes = useRef({ x: 200, y: 300 });
  const [createClusterPopover, setCreateClusterPopover] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [cellColors, setCellColors] = useState({});
  const currentView = useRef(focusedGene ? 'expression' : 'cellSet');
  const [cellInfoVisible, setCellInfoVisible] = useState(false);


  useEffect(() => {
    if (!data && isBrowser) {
      dispatch(loadEmbedding(experimentId, embeddingType));
    }
  }, []);

  const getCellColors = (coloringMode) => {
    if (coloringMode === 'expression') {
      return colorByGeneExpression(focusedExpression);
    }

    if (coloringMode === 'cellSet') {
      const colors = renderCellSetColors(cellSetSelected, cellSetProperties);
      return colors;
    }

    return {};
  };

  // Handle a cell set being selected for coloring.
  useEffect(() => {
    currentView.current = 'cellSet';
    if (!loadingColors && isBrowser) setCellColors(getCellColors('cellSet'));
  }, [cellSetSelected]);

  // Handle focusing/defocusing of genes. This will set a loading
  // state and try to fetch the expression level from the store or the backend.
  // This MUST be after the hook of cellSetSelected
  // to be preferentially loaded over cell set selections.
  useEffect(() => {
    // If we defocused a gene, set it back to cell set coloring view.
    if (!focusedGene) {
      currentView.current = 'cellSet';
      setCellColors(getCellColors('cellSet'));
      return;
    }

    currentView.current = 'expression';
    if (isBrowser) dispatch(loadGeneExpression(experimentId, [focusedGene]));
  }, [focusedGene]);

  // Handle loading of expression for focused gene.
  useEffect(() => {
    if (!focusedExpression) {
      return;
    }
    setCellColors(getCellColors('expression'));
  }, [focusedExpression]);

  const updateCellCoordinates = (newView) => {
    if (selectedCell && newView.viewport.project) {
      const [x, y] = newView.viewport.project([data[selectedCell][0], data[selectedCell][1]]);
      cellCoordintes.current = {
        x,
        y,
        width: newView.viewport.width,
        height: newView.viewport.height,
      };
    }
  };

  const updateCellsHover = (cell) => {
    if (cell) {
      return dispatch(updateCellInfo({
        cellName: cell.cellId,
        geneName: focusedGene,
        expression: focusedExpression ? focusedExpression.expression[cell.cellId] : undefined,
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
    if (selection.size > 0) {
      setCreateClusterPopover(true);
      setSelectedIds(selection);
    }
  };

  // Embedding data is loading.
  if (!data || loading || !isBrowser) {
    return (<center><Spin size='large' /></center>);
  }

  // We are focused on a gene and its expression is loading.
  if (currentView.current === 'expression'
    && expressionLoading.includes(focusedGene)) {
    return (<center><Spin size='large' /></center>);
  }

  // The embedding couldn't load. Display an error condition.
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

  const renderExpressionView = () => {
    if (currentView.current === 'expression') {
      return (
        <div>
          <label htmlFor='gene name'>
            Showing expression for gene:&nbsp;
            <strong>{focusedGene}</strong>
          </label>
          <div>
            <img
              src={legend}
              alt='gene expression legend'
              style={{
                height: 200, width: 20, position: 'absolute', top: 70,
              }}
            />
          </div>
        </div>
      );
    }
    return <></>;
  };

  return (
    <div
      className='vitessce-container vitessce-theme-light'
      style={{ height: '50vh', position: 'relative' }}
      onMouseEnter={() => { setCellInfoVisible(true); }}
      onMouseLeave={() => { setCellInfoVisible(false); }}
    >

      {renderExpressionView()}
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
      {
        createClusterPopover
          ? (
            <ClusterPopover
              popoverPosition={cellCoordintes}
              onCreate={onCreateCluster}
              onCancel={onCancelCreateCluster}
            />
          ) : [
            cellInfoVisible ? [
              <div>
                <CellInfo
                  componentType={embeddingType}
                  coordinates={cellCoordintes}
                />
              </div>,
              <CrossHair
                componentType={embeddingType}
                coordinates={cellCoordintes}
              />,
            ] : <></>,
          ]
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
