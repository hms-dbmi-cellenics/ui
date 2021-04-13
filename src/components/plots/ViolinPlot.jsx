import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import { Skeleton } from 'antd';
import PlatformError from '../PlatformError';
import { generateSpec, generateData } from '../../utils/plotSpecs/generateViolinSpec';
import { loadGeneExpression, loadPaginatedGeneProperties } from '../../redux/actions/genes';
import { loadCellSets } from '../../redux/actions/cellSets';
import { updatePlotConfig } from '../../redux/actions/componentConfig/index';

const ViolinPlot = (props) => {
  const {
    experimentId, config, plotUuid, plotData, actions,
  } = props;
  const dispatch = useDispatch();
  const error = false; // TO_DO - relate to cellset loading and gene expression loading
  const loading = false;

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

  if (config?.shownGene === 'notSelected' && !fetching && !highestDispersionGene) {
    dispatch(loadPaginatedGeneProperties(experimentId, PROPERTIES, plotUuid, tableState));
  }
  useEffect(() => {
    if (cellSets.loading && !cellSets.error) {
      dispatch(loadCellSets(experimentId));
    }
  }, [experimentId]);
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

    if (!loading
      && !error
      && config
      && Object.getOwnPropertyDescriptor(geneExpression.data, config.shownGene)
      && !geneExpression.error
      && !cellSets.loading
      && !cellSets.error) {
      const expressionType = config.normalised === 'normalised' ? 'expression' : 'zScore';
      const generatedPlotData = generateData(
        cellSets,
        geneExpression.data[config.shownGene][expressionType],
        config.selectedCellSet,
        config.selectedPoints,
      );
      setPlotSpec(generateSpec(config, generatedPlotData));
    }
  }, [config, plotData, geneExpression, cellSets, loading]);

  const render = () => {
    if (error) {
      return (
        <PlatformError
          error={error}
        // onClick={() => { dispatch(loadEmbedding(experimentId, embeddingSettings.method)); }}
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

    if (geneExpression.loading.length
      || loading
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

ViolinPlot.defaultProps = {
  plotData: null,
  actions: true,
};

ViolinPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
  plotUuid: PropTypes.string.isRequired,
  plotData: PropTypes.array,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
};

export default ViolinPlot;
