import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Vega } from 'react-vega';

import { generateSpec, generateData } from 'utils/plotSpecs/generateEmbeddingCategoricalSpec';
import { loadEmbedding } from 'redux/actions/embedding';
import { loadCellSets } from 'redux/actions/cellSets';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import { getCellSets } from 'redux/selectors';
import PlatformError from 'components/PlatformError';
import Loader from 'components/Loader';
import 'vega-webgl-renderer';

const CategoricalEmbeddingPlot = (props) => {
  const {
    experimentId, config, actions,
  } = props;
  const dispatch = useDispatch();
  const cellSets = useSelector(getCellSets());

  const embeddingSettings = useSelector(
    (state) => state.experimentSettings.originalProcessing?.configureEmbedding?.embeddingSettings,
  );

  const {
    data: embeddingData,
    loading: embeddingLoading,
    error: embeddingError,
  } = useSelector(
    (state) => state.embeddings[embeddingSettings?.method],
  ) || {};

  const [plotSpec, setPlotSpec] = useState({});

  useEffect(() => {
    if (!embeddingSettings) {
      dispatch(loadProcessingSettings(experimentId));
    }

    if (!cellSets.error) {
      dispatch(loadCellSets(experimentId));
    }

    if (!embeddingData && embeddingSettings?.method) {
      dispatch(loadEmbedding(experimentId, embeddingSettings?.method));
    }
  }, [experimentId, embeddingSettings?.method]);

  // Memoize plotData - only recalculate when data-affecting properties change
  // Dimensions/styling changes do NOT trigger this expensive recalculation
  const memoizedPlotData = useMemo(() => {
    if (!config || !cellSets.accessible || !embeddingData?.length) {
      return null;
    }

    return generateData(cellSets, config.selectedSample, config.selectedCellSet, embeddingData);
  }, [
    cellSets,
    embeddingData,
    config?.selectedSample,
    config?.selectedCellSet,
  ]);

  // Regenerate spec when config (including dimensions/styling) changes
  // This is fast since plotData is cached above
  useEffect(() => {
    if (!config || !cellSets.accessible || !memoizedPlotData) return;

    const { plotData, cellSetLegendsData } = memoizedPlotData;
    setPlotSpec(generateSpec(config, embeddingSettings?.method, plotData, cellSetLegendsData));
  }, [config, cellSets.accessible, memoizedPlotData, embeddingSettings?.method]);

  const render = () => {
    if (cellSets.error) {
      return (
        <PlatformError
          error={cellSets.error}
          onClick={() => { dispatch(loadCellSets(experimentId)); }}
        />
      );
    }

    if (embeddingError) {
      return (
        <PlatformError
          error={embeddingError}
          onClick={() => { dispatch(loadEmbedding(experimentId, embeddingSettings?.method)); }}
        />
      );
    }

    if (!config
      || !cellSets.accessible
      || !embeddingData
      || embeddingLoading
      || Object.keys(plotSpec).length === 0
    ) {
      return (
        <center>
          <Loader experimentId={experimentId} />
        </center>
      );
    }

    return (
      <center>
        <Vega
          spec={plotSpec}
          renderer='webgl'
          actions={actions}
        />
      </center>
    );
  };

  return (
    <>
      {render()}
    </>
  );
};

CategoricalEmbeddingPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
};

CategoricalEmbeddingPlot.defaultProps = {
  actions: true,
  config: null,
};

export default CategoricalEmbeddingPlot;
