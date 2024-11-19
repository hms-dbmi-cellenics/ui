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
import SpatialFeatureReduxWrapper from 'components/plots/SpatialFeatureReduxWrapper';

const { Panel } = Collapse;

const plotUuid = plotUuids.SPATIAL_FEATURE;
const plotType = plotTypes.SPATIAL_FEATURE;
const multiViewUuid = plotUuids.getMultiPlotUuid(plotType);

const SpatialFeaturePage = ({ experimentId }) => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[multiViewUuid]?.config);
  const cellSets = useSelector(getCellSets());
  const multiViewConfig = useSelector((state) => state.componentConfig[multiViewUuid]?.config);
  const multiViewPlotUuids = multiViewConfig?.plotUuids;
  const plotConfigs = useSelector(getPlotConfigs(multiViewPlotUuids));
  const shownGenes = _.compact(multiViewPlotUuids?.map((uuid) => plotConfigs[uuid]?.shownGene));
  const [selectedPlotUuid, setSelectedPlotUuid] = useState(`${plotUuid}-0`);
  const [updateAll, setUpdateAll] = useState(true);
  const [sampleCellSets, setSampleCellSets] = useState(cellSets);

  useEffect(() => {
    const sampleOnlyCellSets = {
      ...cellSets,
      hierarchy: cellSets.hierarchy.filter((item) => item.key === 'sample'),
    };

    setSampleCellSets(sampleOnlyCellSets);
  }, [cellSets]);

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
      controls: [
        {
          name: 'legend',
          props: {
            option: {
              positions: 'top-bottom',
            },
          },
        },
      ],
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
    <SpatialFeatureReduxWrapper
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
      <Panel header='View multiple plots' key='view-multiple-plots' collapsible={false}>
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
          plotType={plotType}
          onUpdate={updateAll ? updateAllWithChanges : updatePlotWithChanges}
          cellSets={sampleCellSets}
        />
      </Panel>
    </>
  );

  return (
    <>
      <Header title={plotNames.SPATIAL_FEATURE} />
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

SpatialFeaturePage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default SpatialFeaturePage;
