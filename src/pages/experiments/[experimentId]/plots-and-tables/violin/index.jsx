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

  const [selectedPlot, setSelectedPlot] = useState(plotUuid);
  const selectedConfig = plotConfigs[selectedPlot];

  const [searchedGene, setSearchedGene] = useState();

  const [rescaleOnce, setRescaleOnce] = useState(true);

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

  // initialise the page with a single plot in multi-view
  useEffect(() => {
    if (!plotConfigs[plotUuid]) {
      dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    }

    if (!multiViewConfig) {
      updateMultiViewWithChanges({
        ncols: 1,
        nrows: 1,
        genes: [],
        plotUuids: [plotUuid],
      });
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

    const plotUuidIndexes = multiViewPlotUuids.map((Uuid) => parseInt(Uuid.match(/[0-9]+/g), 10) || 0);
    const maxIndex = _.max(plotUuidIndexes);

    const plotToAdd = generateMultiViewGridPlotUuid(plotUuid, maxIndex + 1);
    const newPlotUuids = _.concat(multiViewPlotUuids, plotToAdd);

    dispatch(updatePlotConfig(multiViewUuid, { genes: newGenes, plotUuids: newPlotUuids }));

    const loadedConfig = Object.values(plotConfigs)[0];
    const titleToShow = { ...loadedConfig.title, text: geneName };
    dispatch(updatePlotConfig(plotToAdd, { ...loadedConfig, shownGene: geneName, title: titleToShow }));
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
        multiViewUuid={multiViewUuid}
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
