import React, { useState, useEffect } from 'react';
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
import changeEmbeddingAxesIfNecessary from './helpers/changeEmbeddingAxesIfNecessary';

const ContinuousEmbeddingPlot = (props) => {
  const {
    experimentId, config,
    plotData,
    actions, loading, error,
    reloadPlotData, onUpdate,
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

  useEffect(() => {
    changeEmbeddingAxesIfNecessary(config, embeddingSettings?.method, onUpdate);
  }, [config, embeddingSettings?.method]);

  useEffect(() => {
    if (!embeddingLoading
      && !embeddingError
      && config
      && plotData?.length > 0
      && cellSets.accessible
      && embeddingData?.length) {
      setPlotSpec(
        generateSpec(
          config,
          generateData(
            cellSets,
            config.selectedSample,
            plotData,
            embeddingData,
          ),
        ),
      );
    }
  }, [config, plotData, embeddingData, cellSets, embeddingLoading]);

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
      || Object.keys(plotSpec).length === 0) {
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
  plotData: null,
  actions: true,
};

ContinuousEmbeddingPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object,
  plotData: PropTypes.array,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
  loading: PropTypes.bool.isRequired,
  error: PropTypes.bool.isRequired,
  reloadPlotData: PropTypes.func,
  onUpdate: PropTypes.func.isRequired,
};

ContinuousEmbeddingPlot.defaultProps = {
  reloadPlotData: () => { },
  config: null,
  truncatedPlotData: null,
};

export default ContinuousEmbeddingPlot;
