import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Vega } from 'react-vega';
import 'vega-webgl-renderer';

import { getCellSets, getCellSetsHierarchyByKeys } from 'redux/selectors';

import { generateSpec, generateData } from 'utils/plotSpecs/generateViolinSpec';
import { loadGeneExpression, loadPaginatedGeneProperties } from 'redux/actions/genes';
import { loadCellSets } from 'redux/actions/cellSets';
import { updatePlotConfig } from 'redux/actions/componentConfig/index';
import PlatformError from 'components/PlatformError';
import Loader from 'components/Loader';

const geneDispersionsKey = 'dispersions';

const ViolinPlot = (props) => {
  const {
    experimentId, config, plotUuid, searchedGene,
  } = props;
  const dispatch = useDispatch();

  const geneExpression = useSelector((state) => state.genes.expression);
  const cellSets = useSelector(getCellSets());

  const selectedCellSetClassAvailable = useSelector(
    getCellSetsHierarchyByKeys([config.selectedCellSet]),
  ).length;

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

  const loadedGene = useSelector((state) => state.genes.expression.views[plotUuid]?.data);
  useEffect(() => {
    if (loadedGene && loadedGene.length) {
      updatePlotWithChanges(
        {
          shownGene: loadedGene[0],
          title: { text: loadedGene[0] },
        },
      );
    }
  }, [loadedGene]);

  const tableState = {
    pagination: {
      current: 1, pageSize: 1, showSizeChanger: true, total: 0,
    },
    geneNamesFilter: null,
    sorter: { field: geneDispersionsKey, columnKey: geneDispersionsKey, order: 'descend' },
  };
  const updatePlotWithChanges = (changes) => {
    dispatch(updatePlotConfig(plotUuid, changes));
  };

  useEffect(() => {
    if (config?.shownGene !== 'notSelected') {
      dispatch(loadGeneExpression(experimentId, [config.shownGene], plotUuid));
    }
  }, []);

  useEffect(() => {
    // if no saved gene - load the highest dispersion one
    if (config.shownGene === 'notSelected' && !highestDispersionLoading && !highestDispersionGene) {
      dispatch(
        loadPaginatedGeneProperties(experimentId, [geneDispersionsKey], plotUuid, tableState),
      );
    }
  }, [experimentId, config?.shownGene, highestDispersionLoading, highestDispersionGene]);

  useEffect(() => {
    // if no saved gene and highest dispersion gene is loaded - use it
    if (config.shownGene === 'notSelected' && highestDispersionGene) {
      updatePlotWithChanges({ shownGene: highestDispersionGene });
      dispatch(loadGeneExpression(experimentId, [highestDispersionGene], plotUuid));
    }
  }, [experimentId, highestDispersionGene, config.shownGene]);

  useEffect(() => {
    // search for gene and update config.shownGene if letter-cases are not correct
    if (searchedGene) {
      dispatch(loadGeneExpression(experimentId, [searchedGene], plotUuid));
    }
  }, [searchedGene]);

  useEffect(() => {
    if (!cellSets.error) {
      dispatch(loadCellSets(experimentId));
    }
  }, [experimentId, cellSets.accessible, cellSets.error]);

  useEffect(() => {
    if (config
      && !geneExpression.error
      && geneExpression.matrix.geneIsLoaded(config.shownGene)
      && cellSets.accessible) {
      const geneExpressionData = config.normalised === 'normalised'
        ? geneExpression.matrix.getZScore(config.shownGene)
        : geneExpression.matrix.getRawExpression(config.shownGene);

      if (selectedCellSetClassAvailable) {
        const generatedPlotData = generateData(
          cellSets,
          geneExpressionData,
          config.selectedCellSet,
          config.selectedPoints,
        );
        setPlotSpec(generateSpec(config, generatedPlotData));
      }
    }
  }, [experimentId, config, geneExpression, cellSets]);

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

    if (!selectedCellSetClassAvailable) {
      return (
        <PlatformError
          description='No clustering available.'
          reason='Set up your clustering in the configure embedding step in Data Processing to view this plot, or select different data.'
          actionable={false}
        />
      );
    }

    if (highestDispersionError) {
      return (
        <PlatformError
          error={highestDispersionError}
          onClick={() => {
            dispatch(
              loadPaginatedGeneProperties(experimentId, [geneDispersionsKey], plotUuid, tableState),
            );
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

    if (
      geneExpression.loading.length
      || !cellSets.accessible
      || highestDispersionLoading
    ) {
      return <Loader experimentId={experimentId} />;
    }

    return <Vega spec={plotSpec} renderer='webgl' />;
  };

  return render();
};

ViolinPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
  plotUuid: PropTypes.string.isRequired,
  searchedGene: PropTypes.string,
};

ViolinPlot.defaultProps = {
  searchedGene: null,
};

export default ViolinPlot;
