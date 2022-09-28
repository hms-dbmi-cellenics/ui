/* eslint-disable no-param-reassign */
import React, { useEffect, useState } from 'react';
import Loader from 'components/Loader';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import ViolinControls from 'components/plots/styling/violin/ViolinControls';
import _ from 'lodash';

import {
  updatePlotConfig,
} from 'redux/actions/componentConfig/index';
import { loadCellSets } from 'redux/actions/cellSets';
import Header from 'components/Header';
import PlotContainer from 'components/plots/PlotContainer';
import ViolinPlot from 'components/plots/ViolinPlot';
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
const multiViewUuid = multiViewType.concat('-', plotUuid);

const ViolinIndex = ({ experimentId }) => {
  const dispatch = useDispatch();

  const multiViewConfig = useSelector((state) => state.componentConfig[multiViewUuid]?.config);
  const multiViewPlotUuids = multiViewConfig?.plotUuids;

  const plotConfigs = useSelector(getPlotConfigs(multiViewPlotUuids));

  const shownGenes = _.compact(multiViewPlotUuids?.map((uuid) => plotConfigs[uuid]?.shownGene));

  const cellSets = useSelector(getCellSets());

  const geneList = useSelector(getGeneList());

  const geneExpression = useSelector((state) => state.genes.expression);

  const [highestDispersionGene, setHighestDispersionGene] = useState();

  const [selectedPlot, setSelectedPlot] = useState(plotUuid);
  const selectedConfig = plotConfigs[selectedPlot];

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

  // initialise the page with the list of all genes
  useEffect(() => {
    dispatch(loadCellSets(experimentId));

    dispatch(loadGeneList(experimentId));
  }, []);

  // find highest dispersion genes for initial plot state
  useEffect(() => {
    if (typeof geneList.fetching === 'undefined' || geneList.fetching || highestDispersionGene) return;

    const [gene] = getHighestDispersionGenes(geneList.geneData, 1);
    setHighestDispersionGene(gene);
  }, [geneList]);

  // set initial config to highest dispersion gene if configs not found
  useEffect(() => {
    if (!highestDispersionGene) return;

    if (!plotConfigs[plotUuid]) {
      const customConfig = { shownGene: highestDispersionGene, title: { text: highestDispersionGene } };
      loadComponent(plotUuid, plotType, false, customConfig);
    }

    if (!multiViewConfig) {
      const customConfig = { genes: [highestDispersionGene], plotUuids: [plotUuid] };
      loadComponent(multiViewUuid, multiViewType, false, customConfig);
    }
  }, [highestDispersionGene]);

  // load data for genes in multi view
  useEffect(() => {
    if (!Object.values(plotConfigs).every((config) => config) || !multiViewConfig) return;

    const genesToLoad = shownGenes.filter((gene) => !Object.keys(geneExpression.data).includes(gene));

    if (!genesToLoad.length) return;

    dispatch(loadGeneExpression(experimentId, genesToLoad, plotUuid));
  }, [plotConfigs]);

  // rescale plots once when adding a second plot
  useEffect(() => {
    if (!multiViewConfig) return;

    if (multiViewPlotUuids.length > 1 && rescaleOnce) {
      updateAllWithChanges({ dimensions: { width: 550, height: 400 } });
      setRescaleOnce(false);
    }
  }, [multiViewPlotUuids]);

  const addGeneToMultiView = (genes) => {
    const [geneName] = genes;
    if (!Object.keys(geneList.geneData).includes(geneName)) return;
    if (multiViewPlotUuids.length === 30) return;

    const plotUuidIndexes = multiViewPlotUuids.map((Uuid) => parseInt(Uuid.match(/[0-9]+/g), 10));
    const possibleIndexes = [...Array(30).keys()];

    const newIndex = _.min(possibleIndexes.filter((index) => !plotUuidIndexes.includes(index)));

    const plotUuidToAdd = generateMultiViewGridPlotUuid(plotUuid, newIndex);
    const newPlotUuids = _.concat(multiViewPlotUuids, plotUuidToAdd);

    const multiViewUpdatedFields = { plotUuids: newPlotUuids };

    const gridSize = multiViewConfig.nrows * multiViewConfig.ncols;
    if (gridSize < newPlotUuids.length) {
      const newSize = Math.ceil(Math.sqrt(newPlotUuids.length));
      _.merge(multiViewUpdatedFields, { nrows: newSize, ncols: newSize });
    }

    updateMultiViewWithChanges(multiViewUpdatedFields);

    const dimensionsToUse = plotConfigs[multiViewPlotUuids[0]].dimensions;
    const customConfig = { shownGene: geneName, title: { text: geneName }, dimensions: dimensionsToUse };

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
      addGeneToMultiView={addGeneToMultiView}
      setSelectedPlot={setSelectedPlot}
      cellSets={cellSets}
      multiViewConfig={multiViewConfig}
      shownGenes={shownGenes}
      geneList={Object.keys(geneList.geneData)}
    />
  );

  const renderPlot = (selectedPlotUuid) => (
    <ViolinPlot
      experimentId={experimentId}
      plotUuid={selectedPlotUuid}
    />
  );

  const renderMultiView = () => {
    if (geneList.error) {
      return (
        <PlatformError
          error={geneList.error}
          onClick={() => {}}
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
