/* eslint-disable no-param-reassign */
import React, {
  useEffect, useState, useRef,
} from 'react';
import _ from 'lodash';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Button, Collapse } from 'antd';
import {
  updatePlotConfig,
  loadPlotConfig,
} from 'redux/actions/componentConfig/index';
import Loader from 'components/Loader';
import { loadEmbedding } from 'redux/actions/embedding';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import { loadCellSets } from 'redux/actions/cellSets';
import { getCellSets } from 'redux/selectors';

import getTrajectoryPlotStartingNodes from 'redux/actions/componentConfig/getTrajectoryPlotStartingNodes';

import Header from 'components/Header';
import PlotContainer from 'components/plots/PlotContainer';
import TrajectoryAnalysisPlot from 'components/plots/TrajectoryAnalysisPlot';
import PlatformError from 'components/PlatformError';

import { plotNames, plotTypes } from 'utils/constants';
import useConditionalEffect from 'utils/customHooks/useConditionalEffect';
import updateTrajectoryPlotSelectedNodes from 'redux/actions/componentConfig/updateTrajectoryPlotSelectedNodes';
import TrajectoryAnalysisNodeSelector from './TrajectoryAnalysisNodeSelector';
import TrajectoryAnalysisDisplaySettings from './TrajectoryAnalysisDisplaySettings';

const { Panel } = Collapse;

const plotUuid = 'trajectoryAnalysisMain';
const plotType = plotTypes.TRAJECTORY_ANALYSIS;

const initialDisplaySettings = {
  showStartingNodes: true,
  showPseudotimeValues: false,
  hasRunPseudotime: false,
};

const TrajectoryAnalysisPage = ({ experimentId }) => {
  const dispatch = useDispatch();
  const [displaySettings, setDisplaySettings] = useState(initialDisplaySettings);
  const resetZoomRef = useRef();

  // Currenty monocle3 trajectory analysis only supports
  // UMAP embedding. Therefore, this embedding is specifically fetched.
  const embeddingMethod = 'umap';

  const cellSets = useSelector(getCellSets());

  const plotLoading = useSelector((state) => state.componentConfig[plotUuid]?.loading);
  const plotDataError = useSelector((state) => state.componentConfig[plotUuid]?.error);
  const configIsLoaded = useSelector((state) => !_.isNil(state.componentConfig[plotUuid]));

  const embeddingSettings = useSelector(
    (state) => state.experimentSettings.originalProcessing
      ?.configureEmbedding?.embeddingSettings,
  );

  const {
    data: embeddingData,
    loading: embeddingLoading,
    error: embeddingError,
  } = useSelector((state) => state.embeddings[embeddingMethod]) || {};

  useEffect(() => {
    if (!configIsLoaded) {
      dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    }

    if (!cellSets.accessible) dispatch(loadCellSets(experimentId));
    if (!embeddingSettings) dispatch(loadProcessingSettings(experimentId));
  }, []);

  useEffect(() => {
    if (embeddingMethod
      && !embeddingData?.length
      && embeddingSettings
    ) {
      dispatch(loadEmbedding(experimentId, embeddingMethod));
    }
  }, [embeddingMethod, !embeddingSettings]);

  useConditionalEffect(() => {
    if (
      !configIsLoaded
      || !embeddingMethod
      || embeddingLoading
      || embeddingError
      || !embeddingData?.length
    ) return;
    dispatch(getTrajectoryPlotStartingNodes(experimentId, plotUuid));
  }, [
    configIsLoaded,
    embeddingMethod,
    embeddingLoading,
    embeddingSettings,
  ]);

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
      controls: ['axesWithRanges'],
    },
    {
      panelTitle: 'Colours',
      controls: displaySettings.showPseudotimeValues
        ? ['colourScheme', 'colourInversion']
        : ['colourInversion'],
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
    !displaySettings.showPseudotimeValues && {
      panelTitle: 'Labels',
      controls: ['labels'],
    },
  ];

  const render = () => {
    if (cellSets.error) {
      return (
        <PlatformError
          error={cellSets.error}
          onClick={() => { dispatch(loadCellSets(experimentId)); }}
        />
      );
    }

    if (embeddingError) {
      return (
        <PlatformError
          error={embeddingError}
          onClick={() => { dispatch(loadEmbedding(experimentId, embeddingSettings?.method)); }}
        />
      );
    }

    if (plotDataError) {
      return (
        <PlatformError
          error={plotDataError}
          onClick={() => dispatch(getTrajectoryPlotStartingNodes(experimentId, plotUuid))}
        />
      );
    }

    // if (!config
    if (embeddingLoading
      || plotLoading
      || !cellSets.accessible
      || !embeddingData
    ) {
      return (
        <center>
          <Loader experimentId={experimentId} />
        </center>
      );
    }

    return (
      <TrajectoryAnalysisPlot
        ref={resetZoomRef}
        experimentId={experimentId}
        plotUuid={plotUuid}
        onUpdate={updatePlotWithChanges}
        displaySettings={displaySettings}
        plotLoading={plotLoading}
        plotDataError={plotDataError}
        onClickNode={handleClickNode}
        onLassoSelection={handleLassoSelection}
        actions={{ export: true, editor: false, source: false }}
      />
    );
  };

  const renderExtraToolbarControls = () => (
    <>
      <Button
        size='small'
        onClick={() => {
          resetZoomRef.current.resetZoom();
        }}
      >
        Reset Zoom
      </Button>
    </>
  );

  const handleClickNode = (action, selectedNodeId) => {
    dispatch(updateTrajectoryPlotSelectedNodes(plotUuid, [selectedNodeId], action));
  };

  const handleLassoSelection = (nodesInLasso) => {
    dispatch(updateTrajectoryPlotSelectedNodes(plotUuid, nodesInLasso, 'add'));
  };

  return (
    <>
      <Header title={plotNames.TRAJECTORY_ANALYSIS} />
      <PlotContainer
        experimentId={experimentId}
        plotUuid={plotUuid}
        plotType={plotType}
        plotStylingConfig={plotStylingConfig}
        extraToolbarControls={renderExtraToolbarControls()}
        extraControlPanels={(
          <>
            <Panel header='Trajectory analysis' key='trajectory-analysis'>
              <TrajectoryAnalysisNodeSelector
                experimentId={experimentId}
                plotUuid={plotUuid}
                setDisplaySettings={setDisplaySettings}
                displaySettings={displaySettings}
              />
            </Panel>
            <Panel header='Display' key='display'>
              <TrajectoryAnalysisDisplaySettings
                experimentId={experimentId}
                plotUuid={plotUuid}
                setDisplaySettings={setDisplaySettings}
                displaySettings={displaySettings}
              />
            </Panel>
          </>
        )}
        onPlotReset={() => {
          setDisplaySettings(initialDisplaySettings);
          resetZoomRef.current.resetZoom();
        }}
        plotInfo={(
          <>
            Trajectory inference (TI) or pseudotemporal ordering is a computational technique used in single-cell transcriptomics to determine the pattern of a dynamic process experienced by cells and then arrange cells based on their progression through the process by projecting the cells onto an axis called pseudotime. A “trajectory” shows the path of the progression. Currently, Trajectory Analysis is implemented using the
            {' '}
            <a href='https://cole-trapnell-lab.github.io/monocle3/'> Monocle3 </a>
            {' '}
            workflow.
          </>
        )}
        defaultActiveKey='trajectory-analysis'
        saveDebounceTime={10}
      >
        {render()}
      </PlotContainer>
    </>
  );
};
TrajectoryAnalysisPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default TrajectoryAnalysisPage;
