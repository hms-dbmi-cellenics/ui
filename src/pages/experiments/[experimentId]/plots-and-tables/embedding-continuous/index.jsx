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

import SelectData from 'components/plots/styling/embedding-continuous/SelectData';
import Header from 'components/Header';
import PlotContainer from 'components/plots/PlotContainer';
import { loadGeneExpression } from 'redux/actions/genes';

import {
  updatePlotConfig,
} from 'redux/actions/componentConfig/index';
import { loadCellSets } from 'redux/actions/cellSets';
import { getCellSets, getPlotConfigs } from 'redux/selectors';
import { plotNames, plotUuids, plotTypes } from 'utils/constants';
import GeneSearchBar from 'components/plots/GeneSearchBar';
import ContinuousEmbeddingReduxWrapper from 'components/plots/ContinuousEmbeddingReduxWrapper';

const { Panel } = Collapse;

const plotUuid = plotUuids.CONTINUOUS_EMBEDDING;
const plotType = plotTypes.CONTINUOUS_EMBEDDING;
const multiViewUuid = plotUuids.getMultiPlotUuid(plotType);

const ContinuousEmbeddingPage = ({ experimentId }) => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[multiViewUuid]?.config);
  const cellSets = useSelector(getCellSets());
  const multiViewConfig = useSelector((state) => state.componentConfig[multiViewUuid]?.config);
  const multiViewPlotUuids = multiViewConfig?.plotUuids;
  const plotConfigs = useSelector(getPlotConfigs(multiViewPlotUuids));
  const shownGenes = _.compact(multiViewPlotUuids?.map((uuid) => plotConfigs[uuid]?.shownGene));
  const [selectedPlotUuid, setSelectedPlotUuid] = useState(`${plotUuid}-0`);
  const [updateAll, setUpdateAll] = useState(true);

  useEffect(() => {
    dispatch(loadCellSets(experimentId));
  }, []);

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
  const updatePlotWithChanges = (updateField) => {
    dispatch(updatePlotConfig(selectedPlotUuid, updateField));
  };
  const renderPlot = (plotUuidToRender) => (
    <ContinuousEmbeddingReduxWrapper
      experimentId={experimentId}
      plotUuid={plotUuidToRender}

    />
  );

  const changeSelectedPlotGene = (gene) => {
    const plotUuidToUpdate = updateAll ? multiViewPlotUuids[0] : selectedPlotUuid;
    dispatch(loadGeneExpression(
      experimentId, [plotConfigs[plotUuidToUpdate]?.shownGene], gene,
    ));
    dispatch(updatePlotConfig(plotUuidToUpdate, { shownGene: gene, title: { text: gene } }));
  };

  const renderExtraPanels = () => (
    <>
      <Panel header='Gene selection' key='gene-selection'>
        <GeneSearchBar
          allowMultiple={false}
          onSelect={changeSelectedPlotGene}
          buttonText='Submit'
        />
      </Panel>
      <Panel header='View multiple plots' key='view-multiple-plots'>
        <MultiViewEditor
          shownGenes={shownGenes}
          plotType={plotType}
          experimentId={experimentId}
          plotUuid={plotUuid}
          selectedPlotUuid={selectedPlotUuid}
          setSelectedPlotUuid={setSelectedPlotUuid}
          updateAll={updateAll}
          setUpdateAll={setUpdateAll}
        />
      </Panel>
      <Panel header='Select data' key='select-data'>
        <SelectData
          config={config}
          onUpdate={updateAll ? updateAllWithChanges : updatePlotWithChanges}
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
        plotUuid={selectedPlotUuid}
        plotType={plotType}
        plotStylingConfig={plotStylingConfig}
        extraControlPanels={renderExtraPanels()}
        defaultActiveKey='view-multiple-plots'
        onPlotReset={() => dispatch(
          updatePlotConfig(multiViewUuid, { nrows: 1, ncols: 1, plotUuids: [`${plotUuid}-0`] }),
        )}
        onUpdate={updateAll ? updateAllWithChanges : updatePlotWithChanges}
      >
        <MultiViewGrid
          experimentId={experimentId}
          renderPlot={renderPlot}
          updateAllWithChanges={updateAllWithChanges}
          plotType={plotType}
          plotUuid={plotUuid}
        />
      </PlotContainer>
    </>
  );
};

ContinuousEmbeddingPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default ContinuousEmbeddingPage;
