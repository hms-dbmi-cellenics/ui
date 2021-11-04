/* eslint-disable import/no-unresolved */
import React, {
  useRef, useEffect, useState, useCallback,
} from 'react';
import dynamic from 'next/dynamic';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import {
  Empty, Typography, Skeleton,
} from 'antd';
import _ from 'lodash';
import { getCellSets } from 'redux/selectors';
import spec from '../../../utils/heatmapSpec';
import VegaHeatmap from './VegaHeatmap';
import PlatformError from '../../PlatformError';
import { updateCellInfo } from '../../../redux/actions/cellInfo';
import { loadGeneExpression, loadMarkerGenes } from '../../../redux/actions/genes';
import { loadCellSets } from '../../../redux/actions/cellSets';

import { loadComponentConfig } from '../../../redux/actions/componentConfig';
import populateHeatmapData from '../../plots/helpers/populateHeatmapData';
import Loader from '../../Loader';
import CellInfo from '../CellInfo';

import './Heatmap.module.css';

import { listToMatrix, hexToRgb, convertRange } from '../../../utils/heatmapPlotHelperFunctions/helpers';

const COMPONENT_TYPE = 'interactiveHeatmap';
const { Text } = Typography;

const Heatmap = dynamic(
  () => import('vitessce/dist/umd/production/heatmap.min').then((mod) => mod.Heatmap),
  { ssr: false },
);

const HeatmapPlot = (props) => {
  const {
    experimentId, width, height,
  } = props;

  const dispatch = useDispatch();

  const loadingGenes = useSelector((state) => state.genes.expression.loading);
  const selectedGenes = useSelector((state) => state.genes.expression.views[COMPONENT_TYPE]?.data);

  const [viewState, setViewState] = useState({ zoom: 0, target: [0, 0] });
  const [heatmapData, setHeatmapData] = useState(null);
  const [isHeatmapGenesLoading, setIsHeatmapGenesLoading] = useState(false);
  const currentHeatmapSettings = useRef();

  const cellCoordinates = useRef({ x: 200, y: 300 });

  const louvainClustersResolutionRef = useRef(null);

  // const [deckWidth, deckHeight, deckRef] = useDeckCanvasSize();

  const expressionData = useSelector((state) => state.genes.expression);
  const {
    loading: markerGenesLoading, error: markerGenesLoadingError,
  } = useSelector((state) => state.genes.markers);

  const [geneHighlight, setGeneHighlight] = useState(null);

  const cellSets = useSelector(getCellSets());
  const selectedCell = useSelector((state) => state.cellInfo.cellName);

  const {
    hierarchy: cellSetsHierarchy,
    loading: cellSetsLoading,
    hidden: cellSetsHidden,
  } = cellSets;

  const heatmapSettings = useSelector(
    (state) => state.componentConfig[COMPONENT_TYPE]?.config,
  ) || {};

  const louvainClustersResolution = useSelector(
    (state) => state.experimentSettings.processing
      .configureEmbedding?.clusteringSettings.methodSettings.louvain.resolution,
  );

  const focusedExpression = useSelector((state) => state.genes.expression.data[geneHighlight]);

  const {
    legendIsVisible,
  } = heatmapSettings;

  const { error: expressionDataError } = expressionData;
  const viewError = useSelector((state) => state.genes.expression.views[COMPONENT_TYPE]?.error);

  const [maxCells, setMaxCells] = useState(1000);

  const [cellColors, setCellColors] = useState(null);
  const [expressionMatrix, setExpressionMatrix] = useState(null);

  const setHeatmapDataWithDebounce = useCallback(_.debounce((data) => {
    setHeatmapData(data);
  }, 1500, { leading: true }), []);

  const updateCellCoordinates = (newView) => {
    if (selectedCell && newView.project) {
      const [x, y] = newView.project(selectedCell, geneHighlight);

      cellCoordinates.current = {
        x,
        y,
        width,
        height,
      };
    }
  };

  /**
   * Loads cell set on initial render if it does not already exist in the store.
   */
  useEffect(() => {
    dispatch(loadCellSets(experimentId));
  }, []);

  useEffect(() => {
    if (!_.isEmpty(heatmapSettings)) {
      return;
    }

    dispatch(loadComponentConfig(experimentId, COMPONENT_TYPE, COMPONENT_TYPE));
  }, [heatmapSettings]);

  useEffect(() => {
    const selectedGenesLoading = _.intersection(selectedGenes, loadingGenes).length > 0;

    // markerGenesLoading only happen on the first load
    // selectedGenesLoading happens every time the selected genes are changed
    if (selectedGenesLoading || markerGenesLoading) {
      setIsHeatmapGenesLoading(true);
      return;
    }

    setIsHeatmapGenesLoading(false);
  }, [selectedGenes, loadingGenes, markerGenesLoading]);

  useEffect(() => {
    if (!selectedGenes?.length > 0
      || cellSetsHierarchy.length === 0
      || _.isEqual(currentHeatmapSettings, heatmapSettings)
    ) {
      return;
    }

    currentHeatmapSettings.current = heatmapSettings;

    const data = populateHeatmapData(
      cellSets, heatmapSettings, expressionData, selectedGenes, true,
    );

    setHeatmapDataWithDebounce(data);
  }, [
    selectedGenes,
    heatmapSettings,
    maxCells,
    markerGenesLoading,
    cellSetsLoading,
    cellSetsHidden,
  ]);

  useEffect(() => {
    if (louvainClustersResolution
      && !_.isEqual(louvainClustersResolutionRef.current, louvainClustersResolution)
    ) {
      louvainClustersResolutionRef.current = louvainClustersResolution;
      dispatch(loadMarkerGenes(experimentId, louvainClustersResolution, COMPONENT_TYPE));
    }
  }, [louvainClustersResolution]);

  useEffect(() => {
    setMaxCells(Math.floor(width * 0.8));
  }, [width]);

  const buildExpressionMatrix = () => {
    // build expressionMatrix items
    setCellColors(new Map(heatmapData.trackColorData.map((x) => [`${x.cellId}`, hexToRgb(x.color)])));
    const cellIds = heatmapData.cellOrder.map((x) => `${x}`);
    const genes = heatmapData.geneOrder;

    // array with shape [gene_1 cell_1, ..., gene_1 cell_n, gene_2 cell_1, ... ]
    const geneOrderedExpression = heatmapData.heatmapData.map((x) => x.expression);

    // first convert to cell by gene matrix
    const cellByGeneMatrix = listToMatrix(geneOrderedExpression, cellIds.length);

    // scale so that each gene has minimum 0 max 255
    const scaledCellByGeneMatrix = cellByGeneMatrix.map((row) => {
      const geneMin = Math.min(...row);
      const geneMax = Math.max(...row);

      return row.map((x) => convertRange(x, [geneMin, geneMax], [0, 255]));
    });

    // vitesse Heatmap uses:
    // array with shape [cell_1 gene_1, ..., cell_1 gene_n, cell_2 gene_1, ... ]
    // accomplish with transpose and flatten
    const cellOrderedExpression = _.unzip(scaledCellByGeneMatrix).flat();

    // construct expressionMatrix object for vitessce Heatmap
    setExpressionMatrix({
      cols: genes,
      rows: cellIds,
      matrix: Uint8Array.from(cellOrderedExpression),
    });
  };

  useEffect(() => {
    if (!heatmapData) return;

    buildExpressionMatrix();
  }, [heatmapData]);

  if (markerGenesLoadingError) {
    return (
      <PlatformError
        error={expressionDataError}
        onClick={() => {
          dispatch(loadMarkerGenes(experimentId, louvainClustersResolution, COMPONENT_TYPE));
        }}
      />
    );
  }

  if (expressionDataError || viewError) {
    return (
      <PlatformError
        error={expressionDataError}
        onClick={async () => {
          dispatch(loadGeneExpression(experimentId, selectedGenes, COMPONENT_TYPE));
        }}
      />
    );
  }

  if (
    isHeatmapGenesLoading
    || cellSetsLoading
  ) {
    return (
      <center>
        <Loader experimentId={experimentId} />
      </center>
    );
  }

  if (!selectedGenes || selectedGenes.length === 0) {
    return (
      <Empty
        description={(
          <Text>Add some genes to this heatmap to get started.</Text>
        )}
      />
    );
  }

  if (cellSetsHierarchy.length === 0) {
    return (
      <Empty
        description={(
          <Text>Configure your embedding in Data Processing to load this plot.</Text>
        )}
      />
    );
  }

  if (!heatmapData) {
    return (
      <center style={{ marginTop: height / 2 }}>
        <Skeleton.Image />
      </center>
    );
  }

  const setCellHighlight = (cell) => {
    dispatch(updateCellInfo({ cellName: cell }));
  };

  return (
    <div id='heatmap-container'>
      <Heatmap
        uuid='heatmap-0'
        theme='light'
        width={width}
        height={height}
        colormap='plasma'
        colormapRange={[0.0, 1.0]}
        expressionMatrix={expressionMatrix}
        cellColors={cellColors}
        transpose
        viewState={viewState}
        setViewState={({ zoom, target }) => { setViewState({ zoom, target }); }}
        setCellHighlight={setCellHighlight}
        setGeneHighlight={setGeneHighlight}
        updateViewInfo={updateCellCoordinates}
      />
      <div className='cell-info-container'>

        <CellInfo
          componentType='umap'
          coordinates={cellCoordinates}
        />
      </div>
    </div>
  );
};

HeatmapPlot.defaultProps = {
};

HeatmapPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

export default HeatmapPlot;

export { HeatmapPlot, COMPONENT_TYPE };
