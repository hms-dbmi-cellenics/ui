import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import 'vega-webgl-renderer';

import { loadCellSets } from 'redux/actions/cellSets';
import { loadEmbedding } from 'redux/actions/embedding';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import { getCellSets } from 'redux/selectors';
import { generateSpec, generateData } from 'utils/plotSpecs/generateEmbeddingContinuousSpec';
import PlatformError from '../PlatformError';
import Loader from '../Loader';

const ContinuousEmbeddingPlot = (props) => {
  const {
    experimentId, config,
    plotData, truncatedPlotData,
    actions, loading, error,
    reloadPlotData,
  } = props;
  const dispatch = useDispatch();

  const embeddingSettings = useSelector(
    (state) => state.experimentSettings.originalProcessing?.configureEmbedding?.embeddingSettings,
  );

  const {
    data: embeddingData,
    loading: embeddingLoading,
    error: embeddingError,
  } = useSelector((state) => state.embeddings[embeddingSettings?.method]) || {};

  const cellSets = useSelector(getCellSets());

  const [plotSpec, setPlotSpec] = useState({});

  useEffect(() => {
    dispatch(loadCellSets(experimentId));
  }, []);

  useEffect(() => {
    if (!embeddingSettings) {
      dispatch(loadProcessingSettings(experimentId));
    }

    if (!embeddingData && embeddingSettings?.method) {
      dispatch(loadEmbedding(experimentId, embeddingSettings?.method));
    }
  }, [embeddingSettings?.method]);

  // Memoize data generation - only recompute when actual data changes
  const memoizedPlotData = useMemo(() => {
    if (!embeddingLoading
      && !embeddingError
      && config
      && plotData?.length > 0
      && cellSets.accessible
      && embeddingData?.length) {
      return generateData(
        cellSets,
        config.selectedSample,
        config.truncatedValues ? truncatedPlotData : plotData,
        embeddingData,
      );
    }
    return null;
  }, [cellSets, plotData, truncatedPlotData, embeddingData, config?.selectedSample, config?.truncatedValues, embeddingLoading, embeddingError]);

  // Separate effect for spec generation - fast operation using memoized data
  useEffect(() => {
    if (config && memoizedPlotData) {
      setPlotSpec(generateSpec(config, embeddingSettings.method, memoizedPlotData));
    }
  }, [config, memoizedPlotData, embeddingSettings?.method]);

  const render = () => {
    if (error) {
      return (
        <PlatformError
          error={error}
          onClick={() => { reloadPlotData(); }}
        />
      );
    }

    if (cellSets.error) {
      return (
        <PlatformError
          error={error}
          onClick={() => { loadCellSets(experimentId); }}
        />
      );
    }

    if (embeddingError) {
      return (
        <PlatformError
          error={error}
          onClick={() => { loadEmbedding(experimentId, embeddingSettings?.method); }}
        />
      );
    }

    if (!config
      || loading
      || !cellSets.accessible
      || embeddingLoading
      || Object.keys(plotSpec).length === 0
      || !plotData?.length) {
      return (
        <center>
          <Loader experimentId={experimentId} />
        </center>
      );
    }

    return (
      <center>
        <Vega spec={plotSpec} renderer='webgl' actions={actions} />
      </center>
    );
  };

  return (
    <>
      {render()}
    </>
  );
};

ContinuousEmbeddingPlot.defaultProps = {
  reloadPlotData: () => { },
  config: null,
  plotData: null,
  truncatedPlotData: null,
  actions: true,
};

ContinuousEmbeddingPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object,
  plotData: PropTypes.array,
  truncatedPlotData: PropTypes.array,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
  loading: PropTypes.bool.isRequired,
  error: PropTypes.bool.isRequired,
  reloadPlotData: PropTypes.func,
};

export default ContinuousEmbeddingPlot;
