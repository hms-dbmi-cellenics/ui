import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import PlatformError from '../PlatformError';
import { generateSpec, generateData } from '../../utils/plotSpecs/generateEmbeddingContinuousSpec';
import { loadEmbedding } from '../../redux/actions/embedding';
import { loadGeneExpression, loadPaginatedGeneProperties } from '../../redux/actions/genes';
import { loadCellSets } from '../../redux/actions/cellSets';
import { loadProcessingSettings } from '../../redux/actions/experimentSettings';
import { updatePlotConfig } from '../../redux/actions/componentConfig/index';

import Loader from '../Loader';

const ContinuousEmbeddingPlot = (props) => {
  const { experimentId, config, plotUuid } = props;
  const defaultEmbeddingType = 'umap';

  const dispatch = useDispatch();

  const embeddingSettings = useSelector(
    (state) => state.experimentSettings.processing?.configureEmbedding?.embeddingSettings,
  );
  const {
    data: embeddingData,
    loading, error,
  } = useSelector((state) => state.embeddings[embeddingSettings.method]) || {};
  const geneExpression = useSelector((state) => state.genes.expression);
  const geneProperties = useSelector((state) => state.genes.propreties);
  const cellSets = useSelector((state) => state.cellSets);
  const [plotSpec, setPlotSpec] = useState({});
  const PROPERTIES = ['dispersions'];
  const highestDispersionGene = useSelector(
    (state) => state.genes.properties.views[plotUuid]?.data[0],
  );

  const tableState = {
    pagination: {
      current: 1, pageSize: 1, showSizeChanger: true, total: 0,
    },
    geneNamesFilter: null,
    sorter: { field: 'dispersions', columnKey: 'dispersions', order: 'descend' },
  };

  useEffect(() => {
    if (cellSets.loading && !cellSets.error) {
      dispatch(loadCellSets(experimentId));
    }

    if (!embeddingSettings) {
      dispatch(loadProcessingSettings(experimentId, defaultEmbeddingType));
    }

    if (config?.shownGene === 'notSelected') {
      dispatch(loadPaginatedGeneProperties(experimentId, PROPERTIES, plotUuid, tableState));
    }

    if (!embeddingData && embeddingSettings.method) {
      dispatch(loadEmbedding(experimentId, embeddingSettings.method));
    }
  }, [experimentId, embeddingSettings.method]);

  useEffect(() => {
    if (config.shownGene === 'notSelected' && highestDispersionGene) {
      dispatch(loadGeneExpression(experimentId, [highestDispersionGene]));
      dispatch(updatePlotConfig(plotUuid, { shownGene: highestDispersionGene }));
    }
  }, [geneProperties, highestDispersionGene]);

  useEffect(() => {
    if (config.shownGene !== 'notSelected' && !geneExpression.error) {
      dispatch(loadGeneExpression(experimentId, [config.shownGene]));
    }
  }, [experimentId, config]);

  useEffect(() => {
    if (!loading
      && !error
      && Object.getOwnPropertyDescriptor(geneExpression.data, config.shownGene)
      && !geneExpression.error
      && !cellSets.loading
      && !cellSets.error) {
      setPlotSpec(generateData(generateSpec(config), geneExpression.data[config.shownGene], config.selectedSample, embeddingData, cellSets.properties));
    }
  }, [embeddingData, geneExpression, config]);

  const render = () => {
    if (error) {
      return (
        <PlatformError
          error={error}
          onClick={() => { dispatch(loadEmbedding(experimentId, embeddingSettings.method)); }}
        />
      );
    }

    if (geneExpression.error) {
      return (
        <PlatformError
          error={geneExpression.error}
          onClick={() => { dispatch(loadGeneExpression(experimentId, [config.shownGene])); }}
        />
      );
    }

    if (!embeddingData
      || geneExpression.loading.length
      || loading
      || cellSets.loading) {
      return (
        <Loader experimentId={experimentId} />
      );
    }

    return (
      <center>
        <Vega spec={plotSpec} renderer='canvas' />
      </center>
    );
  };

  return (
    <>
      { render()}
    </>
  );
};

ContinuousEmbeddingPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
  plotUuid: PropTypes.object.isRequired,
};

export default ContinuousEmbeddingPlot;
