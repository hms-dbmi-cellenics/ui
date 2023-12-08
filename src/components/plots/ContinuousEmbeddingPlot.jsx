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

const ContinuousEmbeddingPlot = (props) => {
  const {
    experimentId, config,
    plotData, truncatedPlotData,
    actions, loading, error,
    reloadPlotData, useReduxData, plotUuid,
  } = props;
  const dispatch = useDispatch();

  const geneExpression = useSelector((state) => state.genes.expression.full);
  const componentConfigs = useSelector((state) => state.componentConfig);
  const currentConfig = config || componentConfigs[plotUuid]?.config;
  const [dataState, setDataState] = useState({
    plotData,
    truncatedPlotData,
    loading,
    error,
  });

  // we can either pass the data to the component or let it
  // use redux data
  useEffect(() => {
    if (useReduxData && currentConfig?.shownGene) {
      setDataState({
        plotData: geneExpression.matrix.getRawExpression(currentConfig?.shownGene),
        truncatedPlotData: geneExpression.matrix.getTruncatedExpression(currentConfig?.shownGene),
        loading: geneExpression.loading.length > 0,
        error: geneExpression.error,
      });
    }
  }, [geneExpression, currentConfig?.shownGene]);

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
    if (!embeddingLoading
      && !embeddingError
      && currentConfig
      && dataState.plotData?.length > 0
      && cellSets.accessible
      && embeddingData?.length
      && embeddingSettings?.method) {
      setPlotSpec(
        generateSpec(
          currentConfig,
          embeddingSettings.method,
          generateData(
            cellSets,
            currentConfig.selectedSample,
            currentConfig.truncatedValues ? dataState.truncatedPlotData : dataState.plotData,
            embeddingData,
          ),
        ),
      );
    }
  }, [currentConfig, dataState, embeddingData, cellSets, embeddingLoading]);

  const render = () => {
    if (dataState.error) {
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
    if (!currentConfig
      || dataState.loading
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
  reloadPlotData: () => { },
  config: null,
  plotData: null,
  truncatedPlotData: null,
  actions: true,
  useReduxData: false,
  loading: false,
  error: false,
  plotUuid: null,
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
  plotUuid: PropTypes.string,
  loading: PropTypes.bool,
  error: PropTypes.bool,
  reloadPlotData: PropTypes.func,
  useReduxData: PropTypes.bool,
};

export default ContinuousEmbeddingPlot;
