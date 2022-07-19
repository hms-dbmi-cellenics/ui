/* eslint-disable no-param-reassign */
import React, { useEffect, useRef } from 'react';
// import {
//   Collapse,
//   Select,
//   Skeleton,
// } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import _ from 'lodash';

import { getCellSets } from 'redux/selectors';
import {
  updatePlotConfig,
  loadPlotConfig,
  fetchPlotDataWork,
} from 'redux/actions/componentConfig/index';
import Header from 'components/Header';
import { loadCellSets } from 'redux/actions/cellSets';
import TrajectoryAnalysisPlot from 'components/plots/TrajectoryAnalysisPlot';
import PlotContainer from 'components/plots/PlotContainer';
// import SelectData from 'components/plots/styling/SelectData';
import { plotNames, plotTypes } from 'utils/constants';
import { plotBodyWorkTypes } from 'utils/work/generatePlotWorkBody';

// const { Panel } = Collapse;

const plotUuid = 'trajectoryAnalysisMain';
const plotType = plotTypes.TRAJECTORY_ANALYSIS;

const TrajectoryAnalysisPage = ({ experimentId }) => {
  const dispatch = useDispatch();
  const {
    config,
    plotData,
  } = useSelector((state) => state.componentConfig[plotUuid]) || {};
  const cellSets = useSelector(getCellSets());
  // const hierarchy = useSelector(getCellSetsHierarchy());

  const {
    loading: cellSetsLoading,
    error: cellSetsError,
  } = cellSets;

  useEffect(() => {
    if (!config) dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    dispatch(loadCellSets(experimentId));
  }, []);

  const previousComparedConfig = useRef(null);
  const getComparedConfig = (updatedConfig) => _.pick(
    updatedConfig,
    ['useMarkerGenes',
      'nMarkerGenes',
      'selectedGenes',
      'selectedCellSet',
      'selectedPoints'],
  );

  useEffect(() => {
    if (cellSetsLoading || cellSetsError) return;

    const currentComparedConfig = getComparedConfig(config);

    // if (config && !_.isEqual(previousComparedConfig.current, currentComparedConfig)) {
    previousComparedConfig.current = currentComparedConfig;

    dispatch(fetchPlotDataWork(plotBodyWorkTypes.TRAJECTORY_ANALYSIS_ROOT_NODES, experimentId, plotType, plotUuid));
    // }
  }, [config, cellSetsLoading]);

  // const generateGroupByOptions = () => {
  //   if (cellSets.loading) {
  //     return [];
  //   }
  //   return hierarchy.map(({ key, children }) => ({
  //     value: key,
  //     label: `${cellSets.properties[key].name} (${children.length} ${children === 1 ? 'child' : 'children'})`,
  //   }));
  // };

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

  // const renderExtraPanels = () => (
  //   <>
  //     <Panel header='Trajectory analysis' key='trajectory-analysis'>
  //       <SelectData
  //         config={config}
  //         onUpdate={updatePlotWithChanges}
  //         cellSets={cellSets}
  //       />
  //     </Panel>
  //     <Panel header='Group by' key='group-by'>
  //       <p>
  //         Select the cell set category you would like to group cells by.
  //       </p>
  //       {config ? (
  //         <Select
  //           labelInValue
  //           style={{ width: '100%' }}
  //           placeholder='Select cell set...'
  //           loading={config}
  //           value={{ value: config.selectedCellSet }}
  //           options={generateGroupByOptions()}
  //           onChange={({ value }) => updatePlotWithChanges({ selectedCellSet: value })}
  //         />
  //       ) : <Skeleton.Input style={{ width: '100%' }} active />}
  //     </Panel>
  //   </>
  // );

  return (
    <>
      <Header title={plotNames.TRAJECTORY_ANALYSIS} />
      <PlotContainer
        experimentId={experimentId}
        plotUuid={plotUuid}
        plotType={plotType}
        plotStylingConfig={plotStylingConfig}
        plotInfo='The trajectory analysis plot displays the result of trajectory analysis for the given cell set.'
        // extraControlPanels={renderExtraPanels()}
        defaultActiveKey='group-by'
      >
        <TrajectoryAnalysisPlot
          experimentId={experimentId}
          config={config}
          plotUuid={plotUuid}
          plotData={plotData}
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
