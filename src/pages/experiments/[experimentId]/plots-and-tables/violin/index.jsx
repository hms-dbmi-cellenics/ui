/* eslint-disable no-param-reassign */
import React, { useEffect, useState, useCallback } from 'react';
import Loader from 'components/Loader';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import ViolinControls from 'components/plots/styling/violin/ViolinControls';
import _ from 'lodash';

import {
  updatePlotConfig,
  savePlotConfig,
} from 'redux/actions/componentConfig/index';
import { loadCellSets } from 'redux/actions/cellSets';
import Header from 'components/Header';
import PlotContainer from 'components/plots/PlotContainer';
import ViolinPlotMain from 'components/plots/ViolinPlotMain';
import { getCellSets, getGeneList, getPlotConfigs } from 'redux/selectors';
import { plotNames } from 'utils/constants';
import MultiViewGrid from 'components/plots/MultiViewGrid';
import { loadGeneExpression } from 'redux/actions/genes';
import PlatformError from 'components/PlatformError';
import { generateMultiViewGridPlotUuid } from 'utils/generateCustomPlotUuid';
import loadConditionalComponentConfig from 'redux/actions/componentConfig/loadConditionalComponentConfig';
import loadGeneList from 'redux/actions/genes/loadGeneList';
import getHighestDispersionGenes from 'utils/getHighestDispersionGenes';

const plotUuid = 'ViolinMain';
const plotType = 'violin';
const multiViewType = 'multiView';
const multiViewUuid = 'multiView-ViolinMain';

const ViolinIndex = ({ experimentId }) => {
  const dispatch = useDispatch();

  const multiViewConfig = useSelector((state) => state.componentConfig[multiViewUuid]?.config);
  const multiViewPlotUuids = multiViewConfig?.plotUuids;

  const debounceSaveAll = useCallback(_.debounce(() => {
    const allComponentUuids = _.concat(multiViewUuid, multiViewPlotUuids);

    allComponentUuids.forEach((uuid) => {
      if (uuid) {
        dispatch(savePlotConfig(experimentId, uuid));
      }
    });
  }, 2000), [multiViewConfig]);

  const plotConfigs = useSelector(getPlotConfigs(multiViewPlotUuids));

  const shownGenes = _.compact(multiViewPlotUuids?.map((uuid) => plotConfigs[uuid]?.shownGene));

  const cellSets = useSelector(getCellSets());

  const geneList = useSelector(getGeneList());

  const geneNames = Object.keys(geneList.data);

  const geneExpression = useSelector((state) => state.genes.expression);

  const [highestDispersionGene, setHighestDispersionGene] = useState();

  const [selectedPlotUuid, setSelectedPlotUuid] = useState(plotUuid);
  const selectedConfig = plotConfigs[selectedPlotUuid];

  const [updateAll, setUpdateAll] = useState(true);

  const loadComponent = (componentUuid, type, skipAPI, customConfig) => {
    dispatch(loadConditionalComponentConfig(
      experimentId, componentUuid, type, skipAPI, customConfig,
    ));
  };

  const updateMultiViewWithChanges = (updateField) => {
    dispatch(updatePlotConfig(multiViewUuid, updateField));
  };

  const updatePlotWithChanges = (updateField) => {
    dispatch(updatePlotConfig(selectedPlotUuid, updateField));
  };

  const updateAllWithChanges = (updateField) => {
    multiViewPlotUuids.forEach((uuid) => {
      dispatch(updatePlotConfig(uuid, updateField));
    });
  };

  // initialise the page with the list of all genes and multi view
  useEffect(() => {
    dispatch(loadCellSets(experimentId));

    dispatch(loadGeneList(experimentId));

    if (!multiViewConfig) {
      const customConfig = { plotUuids: [plotUuid] };
      loadComponent(multiViewUuid, multiViewType, false, customConfig);
      loadComponent(plotUuid, plotType, false);
    }
  }, []);

  // if selected plot uuid is not shown, change selection
  useEffect(() => {
    if (!multiViewConfig) return;

    if (!multiViewPlotUuids.includes(selectedPlotUuid)) {
      setSelectedPlotUuid(multiViewPlotUuids[0]);
    }
  }, [multiViewConfig]);

  // find highest dispersion genes for initial plot state
  useEffect(() => {
    if (geneList.fetching === undefined || geneList.fetching || highestDispersionGene) return;

    const [gene] = getHighestDispersionGenes(geneList.data, 1);
    setHighestDispersionGene(gene);
  }, [geneList]);

  // load new plots for all multi view plotUuids, with highest dispersion gene if not saved
  useEffect(() => {
    if (!multiViewConfig) return;

    multiViewPlotUuids.forEach((uuid) => {
      if (!plotConfigs[uuid]) {
        loadComponent(uuid, plotType, false);
      }
    });
  }, [multiViewConfig]);

  // update default configs to show highest dispersion gene
  useEffect(() => {
    if (!highestDispersionGene || !multiViewConfig) return;

    multiViewPlotUuids.forEach((uuid) => {
      if (!plotConfigs[uuid]) return;

      if (plotConfigs[uuid].shownGene === 'notSelected') {
        const updatedFields = {
          shownGene: highestDispersionGene,
          title: { text: highestDispersionGene },
        };
        dispatch(updatePlotConfig(uuid, updatedFields));
      }
    });
  }, [multiViewConfig, plotConfigs, highestDispersionGene]);

  // load data for genes in multi view
  useEffect(() => {
    if (!multiViewConfig
      || !multiViewPlotUuids.every((uuid) => plotConfigs[uuid])
      || geneExpression.loading.length > 0) return;

    const genesToLoad = shownGenes.filter((gene) => (
      !geneExpression.matrix.geneIsLoaded(gene) && gene !== 'notSelected'
    ));

    if (genesToLoad.length > 0) {
      dispatch(loadGeneExpression(experimentId, genesToLoad, plotUuid));
    }
  }, [plotConfigs, geneExpression]);

  useEffect(() => {
    if (!multiViewConfig || !multiViewPlotUuids.every((uuid) => plotConfigs[uuid])) return;

    debounceSaveAll();
  }, [plotConfigs, multiViewConfig]);

  const addGeneToMultiView = (genes) => {
    const validGenes = genes.filter((gene) => geneNames.includes(gene));
    const genesToAdd = validGenes.slice(0, 30 - multiViewPlotUuids.length);

    if (genesToAdd.length === 0) return;

    const plotUuidIndexes = multiViewPlotUuids.map((uuid) => parseInt(uuid.match(/[0-9]+/g), 10));
    const newIndexes = [...Array(30).keys()].filter((index) => !plotUuidIndexes.includes(index));

    const newPlotUuids = [...multiViewPlotUuids];

    genesToAdd.forEach((gene, index) => {
      const plotUuidToAdd = generateMultiViewGridPlotUuid(plotUuid, newIndexes[index]);
      newPlotUuids.push(plotUuidToAdd);

      // Taking the config the user currently sees (selectedConfig),
      //  copy it and add the gene-specific settings
      const customConfig = {
        ...selectedConfig,
        shownGene: gene,
        title: { text: gene },
      };

      loadComponent(plotUuidToAdd, plotType, true, customConfig);
    });

    const multiViewUpdatedFields = { plotUuids: newPlotUuids };

    const gridSize = multiViewConfig.nrows * multiViewConfig.ncols;
    if (gridSize < newPlotUuids.length) {
      const newSize = Math.ceil(Math.sqrt(newPlotUuids.length));
      _.merge(multiViewUpdatedFields, { nrows: newSize, ncols: newSize });
    }

    updateMultiViewWithChanges(multiViewUpdatedFields);
  };

  const resetMultiView = () => {
    updateMultiViewWithChanges({ nrows: 1, ncols: 1, plotUuids: [selectedPlotUuid] });
  };

  const plotStylingConfig = [
    {
      panelTitle: 'Main schema',
      controls: ['dimensions'],
      children: [
        {
          panelTitle: 'Title',
          controls: [{
            name: 'title',
            props: {
              placeHolder: 'Gene name if empty',
            },
          }],
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
      panelTitle: 'Markers',
      controls: ['violinMarkers'],
    },
    {
      panelTitle: 'Legend',
      controls: [{
        name: 'legend',
        props: {
          option: {
            positions: 'top-bottom',
          },
        },
      }],
    },

  ];

  const renderExtraPanels = () => (
    <ViolinControls
      config={selectedConfig}
      onUpdate={updatePlotWithChanges}
      onUpdateConditional={updateAll ? updateAllWithChanges : updatePlotWithChanges}
      updateAll={updateAll}
      setUpdateAll={setUpdateAll}
      onMultiViewUpdate={updateMultiViewWithChanges}
      addGeneToMultiView={addGeneToMultiView}
      selectedPlotUuid={selectedPlotUuid}
      setSelectedPlotUuid={setSelectedPlotUuid}
      cellSets={cellSets}
      multiViewConfig={multiViewConfig}
      shownGenes={shownGenes}
    />
  );

  const renderPlot = (plotUuidToRender) => (
    <ViolinPlotMain
      experimentId={experimentId}
      plotUuid={plotUuidToRender}
    />
  );

  const renderMultiView = () => {
    if (geneList.error) {
      return (
        <PlatformError
          error={geneList.error}
          onClick={() => dispatch(loadGeneList(experimentId))}
        />
      );
    }

    if (!multiViewConfig || geneList.fetching) {
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

  return (
    <>
      <Header title={plotNames.VIOLIN_PLOT} />
      <PlotContainer
        experimentId={experimentId}
        plotUuid={selectedPlotUuid}
        plotType={plotType}
        plotStylingConfig={plotStylingConfig}
        plotInfo='In order to rename existing clusters or create new ones, use the cell set tool, located in the Data Exploration page.'
        extraControlPanels={renderExtraPanels()}
        defaultActiveKey='gene-selection'
        onUpdate={updateAll ? updateAllWithChanges : updatePlotWithChanges}
        onPlotReset={resetMultiView}
      >
        {renderMultiView()}
      </PlotContainer>
    </>
  );
};

ViolinIndex.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default ViolinIndex;
