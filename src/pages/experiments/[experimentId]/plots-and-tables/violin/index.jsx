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
import { getCellSets } from 'redux/selectors';
import { plotNames } from 'utils/constants';
import MultiViewGrid from 'components/plots/MultiViewGrid';
import { loadGeneExpression } from 'redux/actions/genes';
import useHighestDispersionGenes from 'utils/customHooks/useHighestDispersionGenes';
import PlatformError from 'components/PlatformError';
import { generateMultiViewGridPlotUuid } from 'utils/generateCustomPlotUuid';

const plotUuid = 'ViolinMain';
const customPlotUuid = 'ViolinMain-0';
const plotType = 'violin';
const multiViewUuid = 'ViolinMain-MultiView';

const ViolinIndex = ({ experimentId }) => {
  const dispatch = useDispatch();

  const multiViewConfig = useSelector((state) => state.componentConfig[multiViewUuid]?.config);
  const multiViewGenes = multiViewConfig?.genes;
  const multiViewPlotUuids = multiViewConfig?.plotUuids;

  const plotConfigs = useSelector((state) => {
    if (!multiViewConfig) return {};
    const plotConfigsToReturn = multiViewConfig.plotUuids.reduce((acum, selectedPlotUuid) => {
      acum[selectedPlotUuid] = state.componentConfig[selectedPlotUuid]?.config;
      return acum;
    }, {});

    return plotConfigsToReturn;
  });

  const cellSets = useSelector(getCellSets());

  const {
    highestDispersionGenes,
    highestDispersionLoading,
    highestDispersionError,
    setReloadHighestDispersion,
  } = useHighestDispersionGenes(experimentId, multiViewUuid, 1);

  const geneExpression = useSelector((state) => state.genes.expression);

  const [selectedPlot, setSelectedPlot] = useState(customPlotUuid);
  const selectedConfig = plotConfigs[selectedPlot];

  const [searchedGene, setSearchedGene] = useState();

  useEffect(() => {
    dispatch(loadCellSets(experimentId));
  }, []);

  // initialise a single plot in multi view with highest dispersion gene
  useEffect(() => {
    if (!highestDispersionGenes.length || multiViewConfig) return;

    dispatch(updatePlotConfig(multiViewUuid, {
      ncols: 2,
      nrows: 2,
      genes: highestDispersionGenes,
      plotUuids: [customPlotUuid],
    }));

    dispatch(loadPlotConfig(experimentId, customPlotUuid, plotType, { shownGene: highestDispersionGenes[0] }));
  }, [highestDispersionGenes]);

  // load plot configs for plots added to multi view
  useEffect(() => {
    if (!multiViewConfig) return;

    const additionalPlotUuids = _.without(multiViewConfig.plotUuids, customPlotUuid);

    additionalPlotUuids.forEach((plot, index) => {
      if (!plotConfigs[plot]) {
        const loadedConfig = plotConfigs[customPlotUuid];
        const geneToShow = multiViewConfig.genes[index];
        const initialPlotConfig = { ...loadedConfig, shownGene: geneToShow };

        dispatch(updatePlotConfig(plot, initialPlotConfig));
      }
    });
  }, [multiViewGenes]);

  // load data for genes in multi view
  useEffect(() => {
    if (multiViewGenes?.length) {
      const genesToLoad = multiViewGenes.filter((gene) => (
        !geneExpression.loading.includes(gene) && !Object.keys(geneExpression.data).includes(gene)
      ));

      if (genesToLoad.length) {
        dispatch(loadGeneExpression(experimentId, genesToLoad, plotUuid));
      }
    }
  }, [multiViewGenes]);

  // update gene shown on selected plot
  useEffect(() => {
    if (!searchedGene) return;

    dispatch(updatePlotConfig(selectedPlot,
      { shownGene: searchedGene, title: { text: searchedGene } }));
  }, [searchedGene]);

  // update multi view genes according to exisitng plot configs
  useEffect(() => {
    if (!Object.values(plotConfigs).every((config) => config) || !multiViewConfig) return;

    const genes = Object.values(plotConfigs).map((config) => config?.shownGene);

    if (_.isEqual(genes, multiViewConfig.genes)
    || genes.length > multiViewConfig.genes.length) return;

    dispatch(updatePlotConfig(multiViewUuid, { genes }));
  }, [plotConfigs]);

  const addGeneToMultiView = (geneName) => {
    const newGenes = _.concat(multiViewGenes, geneName);

    const plotUuidIndexes = multiViewPlotUuids.map((Uuid) => parseInt(Uuid.match(/[0-9]+/g), 10));
    const maxIndex = _.max(plotUuidIndexes);

    const newPlotUuids = _.concat(multiViewPlotUuids, generateMultiViewGridPlotUuid(plotUuid, maxIndex + 1));

    dispatch(updatePlotConfig(multiViewUuid, { genes: newGenes, plotUuids: newPlotUuids }));
  };

  const updateMultiViewWithChanges = (updateField) => {
    dispatch(updatePlotConfig(multiViewUuid, updateField));
  };

  // updateField is a subset of what default config has and contains only the things we want change
  const updatePlotWithChanges = (updateField) => {
    dispatch(updatePlotConfig(selectedPlot, updateField));
  };

  const updateAllWithChanges = (updateField) => {
    multiViewPlotUuids.forEach((Uuid) => {
      dispatch(updatePlotConfig(Uuid, updateField));
    });
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

  const renderPlot = (selectedPlotUuid) => {
    return (
      <ViolinPlot
        experimentId={experimentId}
        plotUuid={selectedPlotUuid}
      />
    );
  };

  const renderMultiView = () => {
    if (highestDispersionLoading) {
      return (
        <center>
          <Loader experimentId={experimentId} />
        </center>
      );
    }

    if (highestDispersionError) {
      return (
        <PlatformError
          error={cellSets.error}
          onClick={() => {
            setReloadHighestDispersion(true);
          }}
        />
      );
    }

    return (
      <MultiViewGrid
        renderPlot={renderPlot}
        multiViewUuid={multiViewUuid}
      />
    );
  };

  return (
    <>
      <Header title={plotNames.VIOLIN_PLOT} />
      <PlotContainer
        experimentId={experimentId}
        plotUuid={customPlotUuid}
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
