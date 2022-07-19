/* eslint-disable no-param-reassign */
import React, { useEffect } from 'react';
import {
  Collapse,
  Select,
  Skeleton,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { getCellSets, getCellSetsHierarchy } from 'redux/selectors';
import {
  updatePlotConfig,
  loadPlotConfig,
} from 'redux/actions/componentConfig/index';
import Header from 'components/Header';
import { loadCellSets } from 'redux/actions/cellSets';
import CategoricalEmbeddingPlot from 'components/plots/CategoricalEmbeddingPlot';
import PlotContainer from 'components/plots/PlotContainer';
import SelectData from 'components/plots/styling/embedding-continuous/SelectData';
import { plotNames, plotTypes } from 'utils/constants';

const { Panel } = Collapse;

const plotUuid = 'trajectoryPlotMain';
const plotType = plotTypes.TRAJECTORY_PLOT;

const TrajectoryAnalysisPage = ({ experimentId }) => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const cellSets = useSelector(getCellSets());
  const hierarchy = useSelector(getCellSetsHierarchy());

  useEffect(() => {
    if (!config) dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    dispatch(loadCellSets(experimentId));
  }, []);

  const generateGroupByOptions = () => {
    if (cellSets.loading) {
      return [];
    }
    return hierarchy.map(({ key, children }) => ({
      value: key,
      label: `${cellSets.properties[key].name} (${children.length} ${children === 1 ? 'child' : 'children'})`,
    }));
  };

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
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
      controls: ['axes'],
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

  const renderExtraPanels = () => (
    <>
      <Panel header='Select data' key='select-data'>
        <SelectData
          config={config}
          onUpdate={updatePlotWithChanges}
          cellSets={cellSets}
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
            loading={config}
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
      <Header title={plotNames.TRAJECTORY_PLOT} />
      <PlotContainer
        experimentId={experimentId}
        plotUuid={plotUuid}
        plotType={plotType}
        plotStylingConfig={plotStylingConfig}
        plotInfo='In order to rename existing clusters or create new ones, use the cell set tool, located in the Data Exploration page.'
        extraControlPanels={renderExtraPanels()}
        defaultActiveKey='group-by'
      >
        <CategoricalEmbeddingPlot
          experimentId={experimentId}
          config={config}
          plotUuid={plotUuid}
          onUpdate={updatePlotWithChanges}
        />
      </PlotContainer>
    </>
  );
};
TrajectoryAnalysisPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default TrajectoryAnalysisPage;
