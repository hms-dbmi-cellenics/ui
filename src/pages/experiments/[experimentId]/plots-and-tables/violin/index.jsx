/* eslint-disable no-param-reassign */
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Collapse, Radio, Form, Slider, Skeleton,
} from 'antd';
import _ from 'lodash';
import { loadGeneExpression } from 'redux/actions/genes';
import SelectData from 'components/plots/styling/SelectData';
import MultiViewGenesEditor from 'components/plots/styling/MultiViewGenesEditor';
import GeneSearchBar from 'components/plots/GeneSearchBar';

import {
  updatePlotConfig,
} from 'redux/actions/componentConfig/index';
import { loadCellSets } from 'redux/actions/cellSets';
import Header from 'components/Header';
import PlotContainer from 'components/plots/PlotContainer';
import ViolinPlotMain from 'components/plots/ViolinPlotMain';
import { getCellSets, getPlotConfigs } from 'redux/selectors';
import { plotNames, plotUuids, plotTypes } from 'utils/constants';
import MultiViewGenesGrid from 'components/plots/MultiViewGenesGrid';

const { Panel } = Collapse;

const plotUuid = plotUuids.VIOLIN_PLOT;
const plotType = plotTypes.VIOLIN_PLOT;
const multiViewUuid = plotUuids.getMultiPlotUuid(plotType);

const ViolinIndex = ({ experimentId }) => {
  const dispatch = useDispatch();

  const multiViewConfig = useSelector((state) => state.componentConfig[multiViewUuid]?.config);
  const multiViewPlotUuids = multiViewConfig?.plotUuids;

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

  const resetMultiView = () => {
    updateMultiViewWithChanges({ nrows: 1, ncols: 1, plotUuids: [`${plotUuid}-0`] });
  };

  // Get the grouping name for X-axis default
  const groupingName = selectedConfig?.selectedCellSet
    ? cellSets.properties?.[selectedConfig.selectedCellSet]?.name
    : 'Cell Set';

  // Get Y-axis default based on normalisation
  const yAxisDefault = selectedConfig?.normalised === 'zScore'
    ? 'Z-Score of Expression'
    : 'Raw Expression';

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
      controls: [{
        name: 'axesWithRanges',
        props: {
          defaultXAxisText: groupingName,
          defaultYAxisText: yAxisDefault,
        },
      }],
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
          defaultTitle: selectedConfig?.shownGene || 'Gene',
        },
      }],
    },

  ];

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
          onSelect={changeSelectedPlotGene}
          allowMultiple={false}
          buttonText='Search'
        />
      </Panel>
      <Panel header='View multiple plots' key='view-multiple-plots'>
        <MultiViewGenesEditor
          updateAll={updateAll}
          experimentId={experimentId}
          setUpdateAll={setUpdateAll}
          plotUuid={plotUuid}
          plotType={plotType}
          selectedPlotUuid={selectedPlotUuid}
          setSelectedPlotUuid={setSelectedPlotUuid}
          shownGenes={shownGenes}
        />
      </Panel>
      <Panel header='Select data' key='select-data'>
        <SelectData
          config={selectedConfig}
          onUpdate={updateAll ? updateAllWithChanges : updatePlotWithChanges}
          cellSets={cellSets}
          firstSelectionText='Select the cell sets or metadata that cells are grouped by (determines the x-axis)'
        />
      </Panel>
      <Panel header='Data transformation' key='data-transformation'>
        {selectedConfig ? (
          <div>
            <Form.Item>
              <p>Transform Gene Expression</p>
              <Radio.Group
                onChange={(e) => updateAll ? updateAllWithChanges({ normalised: e.target.value }) : updatePlotWithChanges({ normalised: e.target.value })}
                value={selectedConfig.normalised}
              >
                <Radio value='raw'>Raw values</Radio>
                <Radio value='zScore'>Z-score</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label='Bandwidth Adjustment'>
              <Slider
                value={selectedConfig.kdeBandwidth}
                min={0}
                max={1}
                onChange={(val) => updateAll ? updateAllWithChanges({ kdeBandwidth: val }) : updatePlotWithChanges({ kdeBandwidth: val })}
                step={0.05}
              />
            </Form.Item>
          </div>
        ) : <Skeleton.Input style={{ width: 200 }} active />}
      </Panel>
    </>
  );

  const renderPlot = (plotUuidToRender) => (
    <ViolinPlotMain
      experimentId={experimentId}
      plotUuid={plotUuidToRender}
    />
  );

  const renderMultiView = () => (
    <MultiViewGenesGrid
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
        defaultActiveKey='view-multiple-plots'
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
