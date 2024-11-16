/* eslint-disable no-param-reassign */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import MultiViewEditor from 'components/plots/styling/MultiViewEditor';
import _ from 'lodash';
import {
  Collapse,
  Select,
  Skeleton,
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
  const shownGenes = _.compact(multiViewPlotUuids?.map((uuid) => plotConfigs[uuid]?.shownGene));
  const [selectedPlotUuid, setSelectedPlotUuid] = useState(`${plotUuid}-0`);
  const [updateAll, setUpdateAll] = useState(true);

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
      panelTitle: 'Colour Inversion',
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
      <Panel header='Select data' key='select-data'>
        <SelectData
          config={config}
          onUpdate={updatePlotWithChanges}
          cellSets={cellSets}
          plotType={plotType}
        />
      </Panel>
      <Panel header='Group by' key='group-by'>
        <p>
          Select the cell set category you would like to group cells by.
        </p>
        {config ? (
          <Select
            labelInValue
            style={{ width: '100%' }}
            placeholder='Select cell set...'
            value={{ value: config.selectedCellSet }}
            options={generateGroupByOptions()}
            onChange={({ value }) => updatePlotWithChanges({ selectedCellSet: value })}
          />
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

SpatialCategoricalPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default SpatialCategoricalPage;
