// eslint-disable-file import/no-extraneous-dependencies
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  useSelector, useDispatch,
} from 'react-redux';
import PropTypes from 'prop-types';
import * as vega from 'vega';
import 'vitessce/dist/es/production/static/css/index.css';

import ClusterPopover from 'components/data-exploration/embedding/ClusterPopover';
import CrossHair from 'components/data-exploration/embedding/CrossHair';
import CellInfo from 'components/data-exploration/CellInfo';
import PlatformError from 'components/PlatformError';
import Loader from 'components/Loader';

import { loadEmbedding } from 'redux/actions/embedding';
import { getCellSetsHierarchyByType, getCellSets } from 'redux/selectors';
import { createCellSet } from 'redux/actions/cellSets';
import { loadGeneExpression } from 'redux/actions/genes';
import { updateCellInfo } from 'redux/actions/cellInfo';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';

import {
  convertCellsData,
  renderCellSetColors,
  colorByGeneExpression,
  colorInterpolator,
} from 'utils/plotUtils';
import getContainingCellSetsProperties from 'utils/cellSets/getContainingCellSetsProperties';

const Scatterplot = dynamic(
  () => import('vitessce/dist/umd/production/scatterplot.min').then((mod) => mod.Scatterplot),
  { ssr: false },
);

const INITIAL_ZOOM = 4.00;
const cellRadiusFromZoom = (zoom) => zoom ** 3 / 50;

const Embedding = (props) => {
  const {
    experimentId, height, width,
  } = props;

  const dispatch = useDispatch();

  const [cellRadius, setCellRadius] = useState(cellRadiusFromZoom(INITIAL_ZOOM));
  const rootClusterNodes = useSelector(getCellSetsHierarchyByType('cellSets')).map(({ key }) => key);

  const selectedCellIds = new Set();

  const embeddingSettings = useSelector(
    (state) => state.experimentSettings?.originalProcessing?.configureEmbedding?.embeddingSettings,
  );
  const embeddingType = embeddingSettings?.method;

  const { data, loading, error } = useSelector((state) => state.embeddings[embeddingType]) || {};

  const focusData = useSelector((state) => state.cellInfo.focus);

  const cellSets = useSelector(getCellSets());
  const {
    properties: cellSetProperties,
    hierarchy: cellSetHierarchy,
    hidden: cellSetHidden,
  } = cellSets;

  const selectedCell = useSelector((state) => state.cellInfo.cellId);
  const expressionLoading = useSelector((state) => state.genes.expression.loading);

  const expressionMatrix = useSelector((state) => state.genes.expression.matrix);

  const focusedExpression = useSelector(
    (state) => state.genes.expression.matrix.getRawExpression(focusData.key),
  );

  const cellCoordinatesRef = useRef({ x: 200, y: 300 });
  const [cellInfoTooltip, setCellInfoTooltip] = useState();
  const [createClusterPopover, setCreateClusterPopover] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [cellColors, setCellColors] = useState({});
  const [cellInfoVisible, setCellInfoVisible] = useState(true);
  const [view, setView] = useState({ target: [4, -4, 0], zoom: INITIAL_ZOOM });

  // Load embedding settings if they aren't already.
  useEffect(() => {
    if (!embeddingSettings) {
      dispatch(loadProcessingSettings(experimentId));
    }
  }, []);

  // Then, try to load the embedding with the appropriate data.
  useEffect(() => {
    if (embeddingSettings && !data) {
      dispatch(loadEmbedding(experimentId, embeddingType));
    }
  }, [embeddingSettings]);

  // Handle focus change (e.g. a cell set or gene or metadata got selected).
  // Also handle here when the cell set properties or hierarchy change.
  useEffect(() => {
    const { store, key } = focusData;

    switch (store) {
      // For genes/continous data, we cannot do this in one go,
      // we need to wait for the thing to load in first.
      case 'genes': {
        dispatch(loadGeneExpression(experimentId, [key], 'embedding'));
        setCellInfoVisible(false);
        return;
      }

      // Cell sets are easy, just return the appropriate color and set them up.
      case 'cellSets': {
        setCellColors(renderCellSetColors(key, cellSetHierarchy, cellSetProperties));
        setCellInfoVisible(false);
        return;
      }

      // If there is no focus, we can just delete all the colors.
      default: {
        setCellColors({});
        setCellInfoVisible(false);
        break;
      }
    }
  }, [focusData, cellSetHierarchy, cellSetProperties]);

  // Handle loading of expression for focused gene.
  useEffect(() => {
    if (!focusedExpression) {
      return;
    }

    const truncatedExpression = expressionMatrix.getTruncatedExpression(focusData.key);
    const { truncatedMin, truncatedMax } = expressionMatrix.getStats(focusData.key);

    setCellColors(colorByGeneExpression(truncatedExpression, truncatedMin, truncatedMax));
  }, [focusData.key, expressionLoading]);

  useEffect(() => {
    if (selectedCell) {
      let expressionToDispatch;
      let geneName;

      if (focusedExpression) {
        geneName = focusData.key;
        expressionToDispatch = focusedExpression[selectedCell];
      }

      // getting the cluster properties for every cluster that has the cellId
      const cellProperties = getContainingCellSetsProperties(
        Number.parseInt(selectedCell, 10),
        rootClusterNodes,
        cellSets,
      );

      const prefixedCellSetNames = [];
      Object.values(cellProperties).forEach((clusterProperties) => {
        clusterProperties.forEach(({ name, parentNodeKey }) => {
          prefixedCellSetNames.push(`${cellSetProperties[parentNodeKey].name} : ${name}`);
        });
      });

      setCellInfoTooltip({
        cellSets: prefixedCellSetNames,
        cellId: selectedCell,
        componentType: embeddingType,
        expression: expressionToDispatch,
        geneName,
      });
    }
  }, [selectedCell]);

  const updateCellCoordinates = (newView) => {
    if (selectedCell && newView.project) {
      const [x, y] = newView.project(selectedCell);
      cellCoordinatesRef.current = {
        x,
        y,
        width,
        height,
      };
    }
  };

  const updateCellsHover = (cell) => dispatch(updateCellInfo({ cellId: cell }));

  const onCreateCluster = (clusterName, clusterColor) => {
    setCreateClusterPopover(false);
    dispatch(
      createCellSet(
        experimentId,
        clusterName,
        clusterColor,
        selectedIds,
      ),
    );
  };

  const onCancelCreateCluster = () => {
    setCreateClusterPopover(false);
  };

  const updateCellsSelection = (selection) => {
    if (Array.from(selection).length > 0) {
      setCreateClusterPopover(true);
      const selectedIdsToInt = new Set(Array.from(selection).map((id) => parseInt(id, 10)));
      setSelectedIds(selectedIdsToInt);
    }
  };

  // Embedding data is loading.
  if (!data || loading) {
    return (<center><Loader experimentId={experimentId} size='large' /></center>);
  }

  // The selected gene in can be present in both expression.loading
  // and expression.matrix loaded genes.
  // To make sure that the gene is really loading, we have to check if
  // it exists in the loading array and is not present in the data array
  if (focusData.store === 'genes'
    && !expressionMatrix.geneIsLoaded(focusData.key)
    && expressionLoading.includes(focusData.key)) {
    return (<center><Loader experimentId={experimentId} size='large' /></center>);
  }

  // The embedding couldn't load. Display an error condition.
  if (error) {
    return (
      <PlatformError
        error={error}
        onClick={() => dispatch(loadEmbedding(experimentId, embeddingType))}
      />
    );
  }

  const renderExpressionView = () => {
    if (focusData.store === 'genes') {
      const colorScale = vega.scale('sequential')()
        .interpolator(colorInterpolator);

      return (
        <div>
          <label htmlFor='continuous data name'>
            <strong>{focusData.key}</strong>
          </label>
          <div
            style={{
              position: 'absolute',
              background: `linear-gradient(${colorScale(1)}, ${colorScale(0)})`,
              height: 200,
              width: 20,
              top: 70,
            }}
          />
        </div>
      );
    }

    if (focusData.store === 'cellSets') {
      return (
        <div>
          <label htmlFor='cell set name'>
            <strong>{cellSetProperties[focusData.key] ? cellSetProperties[focusData.key].name : ''}</strong>
          </label>
        </div>
      );
    }

    return <div />;
  };

  return (
    <div
      className='vitessce-container vitessce-theme-light'
      style={{ width, height, position: 'relative' }}
      // make sure that the crosshairs don't break zooming in and out of the embedding
      onWheel={() => { setCellInfoVisible(false); }}
      onMouseMove={() => {
        if (!cellInfoVisible) {
          setCellInfoVisible(true);
        }
      }}
    >
      {renderExpressionView()}
      {
        data ? (
          <Scatterplot
            cellOpacity={0.8}
            cellRadius={cellRadius}
            setCellHighlight={updateCellsHover}
            theme='light'
            uuid={embeddingType}
            viewState={view}
            updateViewInfo={updateCellCoordinates}
            cells={convertCellsData(data, cellSetHidden, cellSetProperties)}
            mapping='PCA'
            cellSelection={selectedCellIds}
            cellColors={
              (selectedCell)
                ? new Map(Object.entries({ ...cellColors, [selectedCell]: [0, 0, 0] }))
                : new Map(Object.entries(cellColors))
            }
            setViewState={({ zoom, target }) => {
              setCellRadius(cellRadiusFromZoom(zoom));

              setView({ zoom, target });
            }}
            getExpressionValue={() => { }}
            getCellIsSelected={() => { }}
            setCellSelection={updateCellsSelection}

          />
        ) : ''
      }
      {
        createClusterPopover
          ? (
            <ClusterPopover
              visible
              popoverPosition={cellCoordinatesRef}
              onCreate={onCreateCluster}
              onCancel={onCancelCreateCluster}
            />
          ) : (
            (cellInfoVisible && cellInfoTooltip) ? (
              <div>
                <CellInfo
                  containerWidth={width}
                  containerHeight={height}
                  componentType={embeddingType}
                  coordinates={cellCoordinatesRef.current}
                  cellInfo={cellInfoTooltip}
                />
                <CrossHair
                  componentType={embeddingType}
                  coordinates={cellCoordinatesRef}
                />
              </div>
            ) : <></>
          )
      }
    </div>
  );
};

Embedding.defaultProps = {};

Embedding.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  experimentId: PropTypes.string.isRequired,
};
export default Embedding;
