/* eslint-disable no-param-reassign */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import MultiViewEditor from 'components/plots/styling/MultiViewEditor';
import _ from 'lodash';
import {
  Collapse,
} from 'antd';
import MultiViewGrid from 'components/plots/MultiViewGrid';
import Loader from 'components/Loader';

import SelectData from 'components/plots/styling/embedding-continuous/SelectData';
import Header from 'components/Header';
import ContinuousEmbeddingPlot from 'components/plots/ContinuousEmbeddingPlot';
import PlotContainer from 'components/plots/PlotContainer';
import { loadPaginatedGeneProperties, loadGeneExpression } from 'redux/actions/genes';
import loadConditionalComponentConfig from 'redux/actions/componentConfig/loadConditionalComponentConfig';
import { generateMultiViewGridPlotUuid } from 'utils/generateCustomPlotUuid';

import {
  updatePlotConfig,
  loadPlotConfig,
} from 'redux/actions/componentConfig/index';
import { loadCellSets } from 'redux/actions/cellSets';
import { getCellSets, getGeneList, getPlotConfigs } from 'redux/selectors';
import { plotNames } from 'utils/constants';
import GeneSearchBar from 'components/plots/GeneSearchBar';

const { Panel } = Collapse;

const plotUuid = 'embeddingContinuousMain';
const plotType = 'embeddingContinuous';
const multiViewUuid = 'multiView-EmbeddingContinuousMain';
const multiViewType = 'multiView';

const PROPERTIES = ['dispersions'];
const tableState = {
  pagination: {
    current: 1, pageSize: 1000000, showSizeChanger: true,
  },
  geneNamesFilter: null,
  sorter: { field: PROPERTIES[0], columnKey: PROPERTIES[0], order: 'descend' },
};

const ContinuousEmbeddingPage = ({ experimentId }) => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const loadedGene = useSelector((state) => state.genes.expression.views[plotUuid]?.data);
  const cellSets = useSelector(getCellSets());
  const multiViewConfig = useSelector((state) => state.componentConfig[multiViewUuid]?.config);
  const multiViewPlotUuids = multiViewConfig?.plotUuids;
  const geneExpression = useSelector((state) => state.genes.expression.full);
  const fetching = useSelector((state) => state.genes.properties.views[plotUuid]?.fetching);
  const highestDispersionGene = useSelector(
    (state) => state.genes.properties.views[plotUuid]?.data[0],
  );
  const geneList = useSelector(getGeneList());
  const plotConfigs = useSelector(getPlotConfigs(multiViewPlotUuids));

  const shownGenes = _.compact(multiViewPlotUuids?.map((uuid) => plotConfigs[uuid]?.shownGene));
  const expression = useSelector((state) => state.genes.expression.full);

  const geneNames = Object.keys(geneList.data);

  // const [updateAll, setUpdateAll] = useState(true);

  // const [selectedPlotUuid, setSelectedPlotUuid] = useState(plotUuid);
  // const selectedConfig = plotConfigs[selectedPlotUuid];

  // const [searchedGene, setSearchedGene] = useState();

  // const loadComponent = (componentUuid, type, skipAPI, customConfig) => {
  //   dispatch(loadConditionalComponentConfig(
  //     experimentId, componentUuid, type, skipAPI, customConfig,
  //   ));
  // };
  // const updatePlotWithChanges = (updateField) => {
  //   dispatch(updatePlotConfig(selectedPlotUuid, updateField));
  // };

  useEffect(() => {
    // initial render when theres no multi plots
    // if (!selectedConfig) dispatch(loadPlotConfig(experimentId, selectedPlotUuid, plotType));
    dispatch(loadCellSets(experimentId));
    dispatch(loadPaginatedGeneProperties(experimentId, PROPERTIES, plotUuid, tableState));

    // if (!multiViewConfig) {
    //   const customConfig = { plotUuids: [plotUuid] };
    //   loadComponent(multiViewUuid, multiViewType, false, customConfig);
    //   loadComponent(plotUuid, plotType, false);
    // }
  }, []);

  // useEffect(() => {
  //   if (!multiViewConfig) return;

  //   if (!multiViewPlotUuids.includes(selectedPlotUuid)) {
  //     setSelectedPlotUuid(multiViewPlotUuids[0]);
  //   }
  //   // load new plots for all multi view plotUuids, with highest dispersion gene if not saved

  //   multiViewPlotUuids.forEach((uuid) => {
  //     if (!plotConfigs[uuid]) {
  //       loadComponent(uuid, plotType, false);
  //     }
  //   });
  // }, [multiViewConfig]);
  useEffect(() => {
    if (!multiViewConfig
      || !multiViewPlotUuids.every((uuid) => plotConfigs[uuid])
      || expression.loading.length > 0) return;

    const genesToLoad = shownGenes.filter((gene) => (
      !expression.matrix.geneIsLoaded(gene) && gene !== 'notSelected'
    ));

    if (genesToLoad.length > 0) {
      dispatch(loadGeneExpression(experimentId, genesToLoad, plotUuid));
    }
  }, [plotConfigs, expression]);

  // useEffect(() => {
  //   if (config?.shownGene && !searchedGene) {
  //     // Loads expression for saved gene in the config in the initial loading of the plot
  //     // if a new gene wasn't searched for
  //     dispatch(loadGeneExpression(experimentId, [config.shownGene], plotUuid));
  //   }
  // }, [config?.shownGene]);

  // useEffect(() => {
  //   if (loadedGene && loadedGene.length) {
  //     updatePlotWithChanges({ shownGene: loadedGene[0] });
  //   }
  // }, [loadedGene]);

  useEffect(() => {
    if (selectedConfig?.shownGene) {
      console.log('LOADING THE GENE', selectedConfig.shownGene);
      dispatch(loadGeneExpression(experimentId, [selectedConfig.shownGene], plotUuid));
    }
  }, [selectedConfig]);

  // if (config?.shownGene === null && !fetching && !highestDispersionGene) {
  //   dispatch(loadPaginatedGeneProperties(experimentId, PROPERTIES, plotUuid, tableState));
  // }

  // CHECK THIS

  // useEffect(() => {
  //   if (selectedConfig?.shownGene === null && highestDispersionGene) {
  //     updatePlotWithChanges({ shownGene: highestDispersionGene, title: highestDispersionGene });
  //     dispatch(loadGeneExpression(experimentId, [highestDispersionGene], plotUuid));
  //   }
  // }, [highestDispersionGene, selectedConfig]);

  const updateMultiViewWithChanges = (updateField) => {
    dispatch(updatePlotConfig(multiViewUuid, updateField));
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

  const updateAllWithChanges = (updateField) => {
    multiViewPlotUuids.forEach((uuid) => {
      dispatch(updatePlotConfig(uuid, updateField));
    });
  };
  console.log('MULTI VIEW CONFIG ', geneExpression.matrix.getRawExpression(selectedConfig?.shownGene), selectedConfig);

  const renderPlot = (plotUuidToRender, onUpdate) => {
    const currentConfig = plotConfigs[plotUuidToRender];

    return (
      <ContinuousEmbeddingPlot
        experimentId={experimentId}
        config={currentConfig}
        plotUuid={plotUuidToRender}
        plotData={
          geneExpression.matrix.getRawExpression(currentConfig?.shownGene)
        }
        truncatedPlotData={
          geneExpression.matrix.getTruncatedExpression(currentConfig?.shownGene)
        }
        loading={geneExpression.loading.length > 0}
        error={geneExpression.error}
        reloadPlotData={() => loadGeneExpression(
          experimentId, [currentConfig?.shownGene], plotUuid,
        )}
        onUpdate={onUpdate}
      />
    );
  };

  const renderMultiView = () => {
    if (!multiViewConfig) {
      console.log('SHOULD RENDER NOTHING');
      // Render loading state or handle error
      return (
        <center>
          <Loader experimentId={experimentId} />
        </center>
      );
    }

    return (
      <MultiViewGrid
        experimentId={experimentId}
        renderPlot={renderPlot}
        multiViewUuid={multiViewUuid}
        updateAllWithChanges={updateAllWithChanges}
      />
    );
  };
  const renderExtraPanels = () => (
    <>
      <Panel header='Gene selection' key='gene-selection'>
        {/* <GeneSearchBar
          allowMultiple={false}
          onSelect={(gene) => updatePlotWithChanges({ shownGene: gene, title: { text: gene } })}
          buttonText='Submit'
        /> */}
      </Panel>
      <Panel header='Select data' key='select-data'>
        <SelectData
          config={selectedConfig}
          onUpdate={updatePlotWithChanges}
          cellSets={cellSets}
        />
      </Panel>
      <Panel header='View multiple plots' key='view-multiple-plots'>
        {/* <MultiViewEditor
          multiViewConfig={multiViewConfig}
          addGeneToMultiView={addGeneToMultiView}
          updateAll={updateAll}
          setUpdateAll={setUpdateAll}
          onMultiViewUpdate={updateMultiViewWithChanges}
          selectedPlotUuid={selectedPlotUuid}
          setSelectedPlotUuid={setSelectedPlotUuid}
          shownGenes={shownGenes}
        /> */}
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
        onPlotReset={() => dispatch(
          updatePlotConfig(`multiView-${plotType}`, { nrows: 1, ncols: 1, plotUuids: [`multiView-${plotType}`] }),
        )}
      >
        {renderMultiView()}
      </PlotContainer>
    </>
  );
};

ContinuousEmbeddingPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default ContinuousEmbeddingPage;
