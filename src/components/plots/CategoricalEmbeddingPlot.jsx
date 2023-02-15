import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import { generateSpec, generateData } from 'utils/plotSpecs/generateEmbeddingCategoricalSpec';
import { loadEmbedding } from 'redux/actions/embedding';
import { loadCellSets } from 'redux/actions/cellSets';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import { getCellSets } from 'redux/selectors';
import PlatformError from 'components/PlatformError';
import Loader from 'components/Loader';
import changeEmbeddingAxesIfNecessary from 'components/plots/helpers/changeEmbeddingAxesIfNecessary';
import 'vega-webgl-renderer';

const CategoricalEmbeddingPlot = (props) => {
  const {
    experimentId, config, actions, onUpdate,
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

  useEffect(() => {
    changeEmbeddingAxesIfNecessary(config, embeddingSettings?.method, onUpdate);
  }, [config, embeddingSettings?.method]);

  useEffect(() => {
    if (!config || !cellSets.accessible) return;

    if (embeddingData?.length) {
      const {
        plotData,
        cellSetLegendsData,
      } = generateData(cellSets, config.selectedSample, config.selectedCellSet, embeddingData);

      setPlotSpec(generateSpec(config, plotData, cellSetLegendsData));
    }
  }, [config, cellSets, embeddingData, config]);

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

CategoricalEmbeddingPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
  onUpdate: PropTypes.func.isRequired,
};

CategoricalEmbeddingPlot.defaultProps = {
  actions: true,
  config: null,
};

export default CategoricalEmbeddingPlot;
