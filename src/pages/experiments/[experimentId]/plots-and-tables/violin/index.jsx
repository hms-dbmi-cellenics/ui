/* eslint-disable no-param-reassign */
import React, { useEffect, useState } from 'react';
import Loader from 'components/Loader';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import ViolinControls from 'components/plots/styling/violin/ViolinControls';
import _ from 'lodash';

import {
  updatePlotConfig,
  loadPlotConfig,
} from 'redux/actions/componentConfig/index';
import { loadCellSets } from 'redux/actions/cellSets';
import Header from 'components/Header';
import PlotContainer from 'components/plots/PlotContainer';
import ViolinPlot from 'components/plots/ViolinPlot';
import { getCellSets, getPlotConfigs } from 'redux/selectors';
import { plotNames } from 'utils/constants';
import MultiViewGrid from 'components/plots/MultiViewGrid';
import { loadGeneExpression } from 'redux/actions/genes';
import useHighestDispersionGenes from 'utils/customHooks/useHighestDispersionGenes';
import PlatformError from 'components/PlatformError';
import { generateMultiViewGridPlotUuid } from 'utils/generateCustomPlotUuid';
import loadConditionalComponentConfig from 'redux/actions/componentConfig/loadConditionalComponentConfig';

const plotUuid = 'ViolinMain';
const plotType = 'violin';
const multiViewType = 'multiView';
const multiViewUuid = multiViewType.concat('-', plotUuid);

const ViolinIndex = ({ experimentId }) => {
  const dispatch = useDispatch();

  const multiViewConfig = useSelector((state) => state.componentConfig[multiViewUuid]?.config);
  const multiViewGenes = multiViewConfig?.genes;
  const multiViewPlotUuids = multiViewConfig?.plotUuids;

  const plotConfigs = useSelector(getPlotConfigs(multiViewPlotUuids));

  const cellSets = useSelector(getCellSets());

  const {
    highestDispersionGenes,
    highestDispersionLoading,
    highestDispersionError,
    setReloadHighestDispersion,
  } = useHighestDispersionGenes(experimentId, multiViewUuid, 1);

  const geneExpression = useSelector((state) => state.genes.expression);

  const [selectedPlot, setSelectedPlot] = useState(plotUuid);
  const selectedConfig = plotConfigs[selectedPlot];

  const [searchedGene, setSearchedGene] = useState();

  const [rescaleOnce, setRescaleOnce] = useState(true);

  const loadComponent = (componentUuid, type, skipAPI, customConfig) => {
    dispatch(loadConditionalComponentConfig(
      experimentId, componentUuid, type, skipAPI, customConfig,
    ));
  };

  const updateMultiViewWithChanges = (updateField) => {
    dispatch(updatePlotConfig(multiViewUuid, updateField));
  };

  const updatePlotWithChanges = (updateField) => {
    dispatch(updatePlotConfig(selectedPlot, updateField));
  };

  const updateAllWithChanges = (updateField) => {
    multiViewPlotUuids.forEach((Uuid) => {
      dispatch(updatePlotConfig(Uuid, updateField));
    });
  };

  // initialise the page with a single plot in multi-view
  useEffect(() => {
    if (!plotConfigs[plotUuid]) {
      dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    }

    if (!multiViewConfig) {
      const customConfig = { plotUuids: [plotUuid] };
      loadComponent(multiViewUuid, multiViewType, false, customConfig);
    }

    dispatch(loadCellSets(experimentId));
  }, []);

  // set initial config to highest dispersion gene if gene not selected
  useEffect(() => {
    if (!plotConfigs[plotUuid] || !highestDispersionGenes.length) return;

    if (plotConfigs[plotUuid].shownGene === 'notSelected') {
      updatePlotWithChanges({ shownGene: highestDispersionGenes[0] });
    }
  }, [plotConfigs, highestDispersionGenes]);

  // load data for genes in multi view
  useEffect(() => {
    if (multiViewGenes?.length) {
      const genesToLoad = multiViewGenes.filter((gene) => (
        !Object.keys(geneExpression.data).includes(gene)
        && gene !== 'notSelected'
      ));

      if (genesToLoad.length) {
        dispatch(loadGeneExpression(experimentId, genesToLoad, plotUuid));
      }
    }
  }, [multiViewGenes]);

  // update gene shown on selected plot
  useEffect(() => {
    if (!searchedGene) return;

    updatePlotWithChanges({ shownGene: searchedGene, title: { text: searchedGene } });
  }, [searchedGene]);

  // update multi view genes according to exisitng plot configs
  useEffect(() => {
    if (!Object.values(plotConfigs).every((config) => config) || !multiViewConfig) return;

    const genes = multiViewPlotUuids.map((uuid) => plotConfigs[uuid].shownGene);

    if (_.isEqual(genes, multiViewConfig.genes)) return;

    updateMultiViewWithChanges({ genes });
  }, [plotConfigs]);

  // update grid size when adding plots
  useEffect(() => {
    if (!multiViewConfig) return;

    const gridSize = multiViewConfig.nrows * multiViewConfig.ncols;
    if (gridSize < multiViewConfig.plotUuids.length) {
      const newSize = Math.ceil(Math.sqrt(multiViewConfig.plotUuids.length));
      updateMultiViewWithChanges({ nrows: newSize, ncols: newSize });
    }
  }, [multiViewPlotUuids]);

  // rescale plots once when adding a second plot
  useEffect(() => {
    if (!multiViewConfig) return;

    if (multiViewPlotUuids.length > 1 && rescaleOnce) {
      updateAllWithChanges({ dimensions: { width: 550, height: 400 } });
      setRescaleOnce(false);
    }
  }, [multiViewPlotUuids]);

  const addGeneToMultiView = (geneName) => {
    const newGenes = _.concat(multiViewGenes, geneName);
    if (newGenes.length > 16) return;

    const plotUuidIndexes = multiViewPlotUuids.map((Uuid) => parseInt(Uuid.match(/[0-9]+/g), 10));
    const possibleIndexes = [...Array(16).keys()];
    console.log(possibleIndexes);
    const newIndex = _.min(possibleIndexes.filter((index) => !plotUuidIndexes.includes(index)));
    console.log(newIndex);

    const plotUuidToAdd = generateMultiViewGridPlotUuid(plotUuid, newIndex);
    const newPlotUuids = _.concat(multiViewPlotUuids, plotUuidToAdd);

    updateMultiViewWithChanges({ genes: newGenes, plotUuids: newPlotUuids });

    const customConfig = { shownGene: geneName, title: { text: geneName } };

    loadComponent(plotUuidToAdd, plotType, true, customConfig);
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
      onMultiViewUpdate={updateMultiViewWithChanges}
      setSearchedGene={setSearchedGene}
      addGeneToMultiView={addGeneToMultiView}
      setSelectedPlot={setSelectedPlot}
      cellSets={cellSets}
      multiViewConfig={multiViewConfig}
    />
  );

  const renderPlot = (selectedPlotUuid) => (
    <ViolinPlot
      experimentId={experimentId}
      plotUuid={selectedPlotUuid}
    />
  );

  const renderMultiView = () => {
    if (highestDispersionError) {
      return (
        <PlatformError
          error={highestDispersionError}
          onClick={() => {
            setReloadHighestDispersion(true);
          }}
        />
      );
    }

    if (!multiViewConfig || highestDispersionLoading) {
      return (
        <center>
          <Loader experimentId={experimentId} />
        </center>
      );
    }

    return (
      <MultiViewGrid
        renderPlot={renderPlot}
        multiViewConfig={multiViewConfig}
      />
    );
  };

  return (
    <>
      <Header title={plotNames.VIOLIN_PLOT} />
      <PlotContainer
        experimentId={experimentId}
        plotUuid={plotUuid}
        plotType={plotType}
        plotStylingConfig={plotStylingConfig}
        plotInfo='In order to rename existing clusters or create new ones, use the cell set tool, located in the Data Exploration page.'
        extraControlPanels={renderExtraPanels()}
        defaultActiveKey='gene-selection'
        onUpdate={updateAllWithChanges}
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
