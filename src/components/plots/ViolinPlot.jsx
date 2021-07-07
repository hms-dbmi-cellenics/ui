import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';

import Loader from '../Loader';
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

  const geneExpression = useSelector((state) => state.genes.expression);
  const cellSets = useSelector((state) => state.cellSets);
  const [plotSpec, setPlotSpec] = useState({});
  const highestDispersionLoading = useSelector(
    (state) => state.genes.properties.views[plotUuid]?.fetching,
  );
  const highestDispersionError = useSelector(
    (state) => state.genes.properties.views[plotUuid]?.error,
  );
  const highestDispersionGene = useSelector(
    (state) => (state.genes.properties.views[plotUuid]?.data
      ? state.genes.properties.views[plotUuid]?.data[0] : undefined),
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
    if (config?.shownGene === 'notSelected' && !highestDispersionLoading && !highestDispersionGene) {
      dispatch(loadPaginatedGeneProperties(experimentId, PROPERTIES, plotUuid, tableState));
    }
  }, [experimentId, config?.shownGene, highestDispersionLoading, highestDispersionGene]);
  useEffect(() => {
    if (cellSets.loading && !cellSets.error) {
      dispatch(loadCellSets(experimentId));
    }
  }, [experimentId, cellSets.loading, cellSets.error]);
  useEffect(() => {
    if (config?.shownGene === 'notSelected' && highestDispersionGene) {
      dispatch(updatePlotConfig(plotUuid, { shownGene: highestDispersionGene }));
      dispatch(loadGeneExpression(experimentId, [highestDispersionGene], plotUuid));
    }
    if (config?.shownGene !== 'notSelected' && config) {
      dispatch(loadGeneExpression(experimentId, [config.shownGene], plotUuid));
    }
  }, [experimentId, highestDispersionGene, config?.shownGene]);

  useEffect(() => {
    if (plotData) {
      setPlotSpec(generateSpec(config, plotData));
      return;
    }

    if (config
      && Object.getOwnPropertyDescriptor(geneExpression.data, config.shownGene)
      && !geneExpression.error
      && !cellSets.loading
      && !cellSets.error) {
      const geneExpressionData = config.normalised === 'normalised' ? geneExpression.data[config.shownGene].rawExpression.expression : undefined;

      const generatedPlotData = generateData(
        cellSets,
        geneExpressionData,
        config.selectedCellSet,
        config.selectedPoints,
      );
      setPlotSpec(generateSpec(config, generatedPlotData));
    }
  }, [experimentId, config, plotData, geneExpression, cellSets]);

  const render = () => {
    if (cellSets.error) {
      return (
        <PlatformError
          error={cellSets.error}
          onClick={() => {
            dispatch(loadCellSets(experimentId));
          }}
        />
      );
    }
    if (highestDispersionError) {
      return (
        <PlatformError
          error={highestDispersionError}
          onClick={() => {
            dispatch(loadPaginatedGeneProperties(experimentId, PROPERTIES, plotUuid, tableState));
          }}
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
      || cellSets.loading
      || highestDispersionLoading) {
      return (
        <center>
          <Loader />
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
  plotData: PropTypes.object,
  actions: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]),
};

export default ViolinPlot;
