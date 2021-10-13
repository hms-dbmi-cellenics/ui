import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import { fastLoad } from '../Loader';

import PlatformError from '../PlatformError';
import { generateSpec, generateData } from '../../utils/plotSpecs/generateEmbeddingCategoricalSpec';
import { loadEmbedding } from '../../redux/actions/embedding';
import { loadCellSets } from '../../redux/actions/cellSets';
import { loadProcessingSettings } from '../../redux/actions/experimentSettings';
import { getCellSets } from '../../redux/selectors';

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

    if (cellSets.loading && !cellSets.error) {
      dispatch(loadCellSets(experimentId));
    }

    if (!embeddingData && embeddingSettings?.method) {
      dispatch(loadEmbedding(experimentId, embeddingSettings?.method));
    }
  }, [experimentId, embeddingSettings?.method]);

  useEffect(() => {
    if (!config
      || cellSets.loading
      || cellSets.error) {
      return;
    }

    if (embeddingData?.length) {
      const {
        plotData,
        cellSetNames,
      } = generateData(cellSets, config.selectedCellSet, embeddingData);

      setPlotSpec(generateSpec(config, plotData, cellSetNames));
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

    if (cellSets.loading || !embeddingData || embeddingLoading || !config) {
      return (
        <center>
          {fastLoad()}
        </center>
      );
    }

    return (
      <center>
        <Vega spec={plotSpec} renderer='canvas' actions={actions} />
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
  config: PropTypes.object.isRequired,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
};

CategoricalEmbeddingPlot.defaultProps = {
  actions: true,
};

export default CategoricalEmbeddingPlot;
