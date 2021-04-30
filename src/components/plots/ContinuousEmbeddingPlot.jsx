import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import { Skeleton } from 'antd';
import PlatformError from '../PlatformError';
import { generateSpec, generateData } from '../../utils/plotSpecs/generateEmbeddingContinuousSpec';
import { loadEmbedding } from '../../redux/actions/embedding';
import { loadGeneExpression, loadPaginatedGeneProperties } from '../../redux/actions/genes';
import { loadCellSets } from '../../redux/actions/cellSets';
import { loadProcessingSettings } from '../../redux/actions/experimentSettings';
import { updatePlotConfig } from '../../redux/actions/componentConfig/index';

const ContinuousEmbeddingPlot = (props) => {
  const {
    experimentId, config, plotUuid, plotData, actions,
  } = props;
  const dispatch = useDispatch();

  const embeddingSettings = useSelector(
    (state) => state.experimentSettings.processing?.configureEmbedding?.embeddingSettings,
  );
  const {
    data: embeddingData,
    loading: embeddingLoading,
    error: embeddingError,
  } = useSelector((state) => state.embeddings[embeddingSettings?.method]) || {};
  const geneExpression = useSelector((state) => state.genes.expression);
  const cellSets = useSelector((state) => state.cellSets);
  const [plotSpec, setPlotSpec] = useState({});
  const fetching = useSelector((state) => state.genes.properties.views[plotUuid]?.fetching);
  const highestDispersionGene = useSelector(
    (state) => state.genes.properties.views[plotUuid]?.data[0],
  );
  const PROPERTIES = ['dispersions'];
  const tableState = {
    pagination: {
      current: 1, pageSize: 1, showSizeChanger: true, total: 0,
    },
    geneNamesFilter: null,
    sorter: { field: PROPERTIES[0], columnKey: PROPERTIES[0], order: 'descend' },
  };

  useEffect(() => {
    if (!config) {
      return;
    }

    const spec = generateSpec(config);
    setPlotSpec(spec);
  }, [config]);

  if (config?.shownGene === 'notSelected' && !fetching && !highestDispersionGene) {
    dispatch(loadPaginatedGeneProperties(experimentId, PROPERTIES, plotUuid, tableState));
  }

  useEffect(() => {
    if (cellSets.loading && !cellSets.error) {
      dispatch(loadCellSets(experimentId));
    }

    if (!embeddingSettings) {
      dispatch(loadProcessingSettings(experimentId));
    }

    if (!embeddingData && embeddingSettings?.method) {
      dispatch(loadEmbedding(experimentId, embeddingSettings.method));
    }
  }, [experimentId, embeddingSettings?.method]);

  useEffect(() => {
    if (config?.shownGene === 'notSelected' && highestDispersionGene) {
      dispatch(updatePlotConfig(plotUuid, { shownGene: highestDispersionGene }));
      dispatch(loadGeneExpression(experimentId, [highestDispersionGene], plotUuid));
    }
  }, [highestDispersionGene, config]);

  useEffect(() => {
    if (config?.shownGene !== 'notSelected' && config) {
      dispatch(loadGeneExpression(experimentId, [config.shownGene], plotUuid));
    }
  }, [highestDispersionGene, config?.shownGene]);

  useEffect(() => {
    if (plotData) {
      setPlotSpec(generateSpec(config, plotData));
      return;
    }

    if (!embeddingLoading
      && !embeddingError
      && config
      && Object.getOwnPropertyDescriptor(geneExpression.data, config.shownGene)
      && !geneExpression.error
      && !cellSets.loading
      && !cellSets.error) {
      setPlotSpec(
        generateSpec(
          config,
          generateData(
            cellSets,
            config.selectedSample,
            geneExpression.data[config.shownGene].expression,
            embeddingData,
          ),
        ),
      );
    }
  }, [config, plotData, embeddingData, geneExpression, cellSets, embeddingLoading]);

  const render = () => {
    if (embeddingError) {
      return (
        <PlatformError
          error={embeddingError}
          onClick={() => { dispatch(loadEmbedding(experimentId, embeddingSettings.method)); }}
        />
      );
    }

    if (geneExpression.error) {
      return (
        <PlatformError
          error={geneExpression.error}
          onClick={() => {
            dispatch(loadGeneExpression(experimentId, [config.shownGene], plotUuid));
          }}
        />
      );
    }

    if (!embeddingData
      || geneExpression.loading.length
      || embeddingLoading
      || cellSets.loading
      || fetching) {
      return (
        <center>
          <Skeleton.Image style={{ width: 400, height: 400 }} />
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

ContinuousEmbeddingPlot.defaultProps = {
  plotData: null,
  actions: true,
};

ContinuousEmbeddingPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
  plotUuid: PropTypes.string.isRequired,
  plotData: PropTypes.array,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
};

export default ContinuousEmbeddingPlot;
