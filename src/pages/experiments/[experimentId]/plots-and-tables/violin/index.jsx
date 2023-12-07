/* eslint-disable no-param-reassign */
import React, { useEffect, useState, useCallback } from 'react';
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
import { plotNames, plotUuids, plotTypes } from 'utils/constants';
import MultiViewGrid from 'components/plots/MultiViewGrid';

const plotUuid = plotUuids.VIOLIN_PLOT;
const plotType = plotTypes.VIOLIN_PLOT;
const multiViewUuid = plotUuids.getMultiPlotUuid(plotType);

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

  const [selectedPlotUuid, setSelectedPlotUuid] = useState(`${plotUuid}-0`);
  const selectedConfig = plotConfigs[selectedPlotUuid];

  const [updateAll, setUpdateAll] = useState(true);

  // wont need
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

  useEffect(() => {
    dispatch(loadCellSets(experimentId));
  }, []);

  useEffect(() => {
    if (!multiViewConfig || !multiViewPlotUuids.every((uuid) => plotConfigs[uuid])) return;

    debounceSaveAll();
  }, [plotConfigs, multiViewConfig]);

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
      selectedPlotUuid={selectedPlotUuid}
      setSelectedPlotUuid={setSelectedPlotUuid}
      cellSets={cellSets}
      shownGenes={shownGenes}
      experimentId={experimentId}
    />
  );

  const renderPlot = (plotUuidToRender) => (
    <ViolinPlotMain
      experimentId={experimentId}
      plotUuid={plotUuidToRender}
    />
  );

  const renderMultiView = () => (
    <MultiViewGrid
      experimentId={experimentId}
      renderPlot={renderPlot}
      updateAllWithChanges={updateAllWithChanges}
      plotType={plotType}
      plotUuid={plotUuid}
    />
  );
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
