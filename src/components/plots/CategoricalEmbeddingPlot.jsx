import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import Loader from '../Loader';

import PlatformError from '../PlatformError';
import { generateSpec, generateData } from '../../utils/plotSpecs/generateEmbeddingCategoricalSpec';
import { loadEmbedding } from '../../redux/actions/embedding';
import { loadCellSets } from '../../redux/actions/cellSets';
import { loadProcessingSettings } from '../../redux/actions/experimentSettings';
import { getCellSets } from '../../redux/selectors';
import changeEmbeddingAxesIfNecessary from './helpers/changeEmbeddingAxesIfNecessary';

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

    if (cellSets.loading && !cellSets.error) {
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
    if (!config
      || cellSets.loading
      || cellSets.error) {
      return;
    }

    if (embeddingData?.length) {
      const {
        plotData,
        cellSetLegendsData,
      } = generateData(cellSets, config.selectedSample, config.selectedCellSet, embeddingData);

      setPlotSpec(generateSpec(config, plotData, cellSetLegendsData));
    }
  }, [config, cellSets, embeddingData, config]);

  const render = () => {
    if (embeddingError) {
      return (
        <PlatformError
          error={embeddingError}
          onClick={() => { dispatch(loadEmbedding(experimentId, embeddingSettings?.method)); }}
        />
      );
    }

    if (!config
      || cellSets.loading
      || !embeddingData
      || embeddingLoading
      || !config
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
        <Vega spec={plotSpec} renderer='canvas' actions={actions} scaleFactor={2} />
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
