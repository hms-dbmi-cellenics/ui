/* eslint-disable no-param-reassign */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import MultiViewPlotEditor from 'components/plots/styling/MultiViewPlotEditor';
import _ from 'lodash';
import {
  Collapse,
  Select,
  Skeleton,
  Form,
} from 'antd';
import MultiViewPlotGrid from 'components/plots/MultiViewPlotGrid';

import SelectData from 'components/plots/styling/embedding-continuous/SelectData';
import Header from 'components/Header';
import PlotContainer from 'components/plots/PlotContainer';
import { loadGeneExpression } from 'redux/actions/genes';

import {
  updatePlotConfig,
} from 'redux/actions/componentConfig/index';
import { loadCellSets } from 'redux/actions/cellSets';
import { getCellSets, getPlotConfigs, getCellSetsHierarchy } from 'redux/selectors';
import { plotNames, plotUuids, plotTypes } from 'utils/constants';
import SpatialCategoricalReduxWrapper from 'components/plots/SpatialCategoricalReduxWrapper';

const { Panel } = Collapse;

const plotUuid = plotUuids.SPATIAL_CATEGORICAL;
const plotType = plotTypes.SPATIAL_CATEGORICAL;
const multiViewUuid = plotUuids.getMultiPlotUuid(plotType);

const SpatialCategoricalPage = ({ experimentId }) => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[multiViewUuid]?.config);
  const cellSets = useSelector(getCellSets());
  const hierarchy = useSelector(getCellSetsHierarchy());
  const multiViewConfig = useSelector((state) => state.componentConfig[multiViewUuid]?.config);
  const multiViewPlotUuids = multiViewConfig?.plotUuids;
  const plotConfigs = useSelector(getPlotConfigs(multiViewPlotUuids));
  const [selectedPlotUuid, setSelectedPlotUuid] = useState(`${plotUuid}-0`);
  const [updateAll, setUpdateAll] = useState(true);

  console.log(plotConfigs);

  useEffect(() => {
    dispatch(loadCellSets(experimentId));
  }, []);

  const generateGroupByOptions = () => {
    if (!cellSets.accessible) {
      return [];
    }
    return hierarchy.map(({ key, children }) => ({
      value: key,
      label: `${cellSets.properties[key].name} (${children.length} ${children === 1 ? 'child' : 'children'})`,
    }));
  };

  const plotStylingConfig = [
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
      panelTitle: 'Colour inversion',
      controls: ['colourInversion'],
    },
    {
      panelTitle: 'Markers',
      controls: ['markers'],
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
    {
      panelTitle: 'Labels',
      controls: ['labels'],
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
    <SpatialCategoricalReduxWrapper
      experimentId={experimentId}
      plotUuid={plotUuidToRender}

    />
  );

  const renderExtraPanels = () => (
    <>
      <Panel header='View multiple plots' key='view-multiple-plots' collapsible={false}>
        <MultiViewPlotEditor
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
          onUpdate={updatePlotWithChanges}
          cellSets={cellSets}
          plotType={plotType}
        />
      </Panel>
      <Panel header='Group by' key='group-by'>
        <p><strong>Cell Set For Embedding:</strong></p>
        {config ? (
          <>
            <Form.Item>
              <Select
                labelInValue
                style={{ width: '100%' }}
                placeholder='Select cell set...'
                value={config.selectedCellSet}
                options={generateGroupByOptions()}
                onChange={({ value }) => updatePlotWithChanges({ selectedCellSet: value })}
              />
            </Form.Item>
          </>
        ) : <Skeleton.Input style={{ width: '100%' }} active />}
      </Panel>
    </>
  );

  return (
    <>
      <Header title={plotNames.SPATIAL_CATEGORICAL} />
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
        <MultiViewPlotGrid
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

SpatialCategoricalPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default SpatialCategoricalPage;
