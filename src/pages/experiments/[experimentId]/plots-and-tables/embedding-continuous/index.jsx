/* eslint-disable no-param-reassign */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';

import {
  Collapse,
} from 'antd';

import SelectData from 'components/plots/styling/embedding-continuous/SelectData';
import Header from 'components/Header';
import ContinuousEmbeddingPlot from 'components/plots/ContinuousEmbeddingPlot';
import SingleGeneSelection from 'components/plots/styling/SingleGeneSelection';
import PlotContainer from 'components/plots/PlotContainer';

import {
  updatePlotConfig,
  loadPlotConfig,
} from 'redux/actions/componentConfig/index';
import { loadCellSets } from 'redux/actions/cellSets';
import { loadGeneExpression, loadPaginatedGeneProperties } from 'redux/actions/genes';
import { getCellSets } from 'redux/selectors';
import { plotNames } from 'utils/constants';

const { Panel } = Collapse;

const plotUuid = 'embeddingContinuousMain';
const plotType = 'embeddingContinuous';
const PROPERTIES = ['dispersions'];
const tableState = {
  pagination: {
    current: 1, pageSize: 1, showSizeChanger: true, total: 0,
  },
  geneNamesFilter: null,
  sorter: { field: PROPERTIES[0], columnKey: PROPERTIES[0], order: 'descend' },
};

const ContinuousEmbeddingPage = ({ experimentId }) => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const loadedGene = useSelector((state) => state.genes.expression.views[plotUuid]?.data);
  const cellSets = useSelector(getCellSets());

  const geneExpression = useSelector((state) => state.genes.expression);
  const fetching = useSelector((state) => state.genes.properties.views[plotUuid]?.fetching);
  const highestDispersionGene = useSelector(
    (state) => state.genes.properties.views[plotUuid]?.data[0],
  );

  const [searchedGene, setSearchedGene] = useState();

  useEffect(() => {
    if (!config) dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    dispatch(loadCellSets(experimentId));
  }, []);

  useEffect(() => {
    if (config?.shownGene && !searchedGene) {
      // Loads expression for saved gene in the config in the initial loading of the plot
      // if a new gene wasn't searched for
      dispatch(loadGeneExpression(experimentId, [config.shownGene], plotUuid));
    }
  }, [config?.shownGene]);

  useEffect(() => {
    if (loadedGene && loadedGene.length) {
      updatePlotWithChanges({ shownGene: loadedGene[0] });
    }
  }, [loadedGene]);

  useEffect(() => {
    if (searchedGene) {
      dispatch(loadGeneExpression(experimentId, [searchedGene], plotUuid));
    }
  }, [searchedGene]);

  if (config?.shownGene === null && !fetching && !highestDispersionGene) {
    dispatch(loadPaginatedGeneProperties(experimentId, PROPERTIES, plotUuid, tableState));
  }

  useEffect(() => {
    if (config?.shownGene === null && highestDispersionGene) {
      updatePlotWithChanges({ shownGene: highestDispersionGene });
      dispatch(loadGeneExpression(experimentId, [highestDispersionGene], plotUuid));
    }
  }, [highestDispersionGene, config]);

  const updatePlotWithChanges = (updateField) => {
    dispatch(updatePlotConfig(plotUuid, updateField));
  };

  const plotStylingConfig = [
    {
      panelTitle: 'Expression values',
      controls: ['expressionValuesCapping'],
    },
    {
      panelTitle: 'Main schema',
      controls: ['dimensions'],
      children: [
        {
          panelTitle: 'Title',
          controls: ['title'],
        },
        {
          panelTitle: 'Font',
          controls: ['font'],
        },
      ],
    },
    {
      panelTitle: 'Axes and margins',
      controls: ['axesWithRanges'],
    },
    {
      panelTitle: 'Colours',
      controls: ['colourScheme', 'colourInversion'],
    },
    {
      panelTitle: 'Markers',
      controls: ['markers'],
    },
    {
      panelTitle: 'Legend',
      controls: ['legend'],
    },
  ];

  const renderExtraPanels = () => (
    <>
      <Panel header='Gene selection' key='gene-selection'>
        <SingleGeneSelection
          config={config}
          setSearchedGene={setSearchedGene}
        />
      </Panel>
      <Panel header='Select data' key='select-data'>
        <SelectData
          config={config}
          onUpdate={updatePlotWithChanges}
          cellSets={cellSets}
        />
      </Panel>
    </>
  );

  return (
    <>
      <Header title={plotNames.CONTINUOUS_EMBEDDING} />
      <PlotContainer
        experimentId={experimentId}
        plotUuid={plotUuid}
        plotType={plotType}
        plotStylingConfig={plotStylingConfig}
        extraControlPanels={renderExtraPanels()}
        defaultActiveKey='gene-selection'
      >
        <ContinuousEmbeddingPlot
          experimentId={experimentId}
          config={config}
          plotUuid={plotUuid}
          plotData={
            geneExpression.matrix.getRawExpression(config?.shownGene)
          }
          truncatedPlotData={
            geneExpression.matrix.getTruncatedExpression(config?.shownGene)
          }
          loading={geneExpression.loading.length > 0}
          error={geneExpression.error}
          reloadPlotData={() => loadGeneExpression(
            experimentId, [config?.shownGene], plotUuid,
          )}
          onUpdate={updatePlotWithChanges}
        />
      </PlotContainer>
    </>
  );
};

ContinuousEmbeddingPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default ContinuousEmbeddingPage;
