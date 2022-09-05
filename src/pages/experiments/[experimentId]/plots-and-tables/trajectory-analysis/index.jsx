/* eslint-disable no-param-reassign */
import React, {
  useEffect, useState, useRef,
} from 'react';
import _ from 'lodash';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Button } from 'antd';
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
// import getTrajectoryPlotPseudoTime from 'redux/actions/componentConfig/getTrajectoryPlotPseudoTime';

import Header from 'components/Header';
import PlotContainer from 'components/plots/PlotContainer';
import TrajectoryAnalysisPlot from 'components/plots/TrajectoryAnalysisPlot';
import PlatformError from 'components/PlatformError';

import { plotNames, plotTypes } from 'utils/constants';
import useConditionalEffect from 'utils/customHooks/useConditionalEffect';
import updateTrajectoryNodes from 'redux/actions/componentConfig/updateTrajectoryNodes';
import TrajectoryExtraPanels from './TrajectoryExtraPanels';

const plotUuid = 'trajectoryAnalysisMain';
const plotType = plotTypes.TRAJECTORY_ANALYSIS;

const initialPlotState = {
  displayTrajectory: true,
  displayPseudotime: false,
  hasRunPseudotime: false,
  // isZoomedOrPanned: false,
};

const TrajectoryAnalysisPage = ({ experimentId }) => {
  const dispatch = useDispatch();
  const [plotState, setPlotState] = useState(initialPlotState);
  // const [configLoaded, setConfigLoaded] = useState(false);
  const resetZoomRef = useRef();

  // Currenty monocle3 trajectory analysis only supports
  // UMAP embedding. Therefore, this embedding is specifically fetched.
  const embeddingMethod = 'umap';

  const cellSets = useSelector(getCellSets());

  // const {
  //   // config,
  //   // plotData,
  //   // loading: plotLoading,
  //   // error: plotDataError,
  // } = useSelector((state) => state.componentConfig[plotUuid]);

  const plotLoading = useSelector((state) => state.componentConfig[plotUuid]?.loading, _.isEqual);
  const plotDataError = useSelector((state) => state.componentConfig[plotUuid]?.error, _.isEqual);

  const configIsLoaded = useSelector((state) => !_.isNil(state.componentConfig[plotUuid]), _.isEqual);

  // const selectedNodes = useSelector((state) => state.componentConfig[plotUuid]?.config?.selectedNodes, _.isEqual);
  // const {
  //   config,
  //   loading: configLoading,
  //   plotData,
  //   loading: plotLoading,
  //   error: plotDataError,
  // } = useSelector((state) => state.componentConfig[plotUuid].loading) || {};

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
      // `configLoaded` is used instead of `config` because this block of code should only be called
      // once when the config is loaded, or when embedding settings changes. Using `config`
      // in the dependency array will make this code be executed everytime there is a config change.
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
      controls: plotState.displayPseudotime
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
    !plotState.displayPseudotime && {
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
        // config={config}
        onUpdate={updatePlotWithChanges}
        plotState={plotState}
        // plotData={plotData}
        plotLoading={plotLoading}
        plotDataError={plotDataError}
        onClickNode={handleClickNode}
        onLassoSelection={handleLassoSelection}
        actions={{ export: true, editor: false, source: false }}
      />
    );
  };

  console.log('*** rendered');

  const renderExtraToolbarControls = () => (
    <>
      <Button
        size='small'
        // disabled={!plotState.isZoomedOrPanned}
        onClick={() => {
          resetZoomRef.current.resetZoom();
        }}
      >
        Reset Zoom
      </Button>
    </>
  );

  const handleClickNode = (action, selectedNodeId) => {
    // const removeFromSelection = (nodeId) => selectedNodes.filter((node) => nodeId !== node);
    // const addToSelection = (nodeId) => [...selectedNodes, nodeId];

    // const updatedSelection = action === 'add'
    //   ? addToSelection(selectedNodeId)
    //   : removeFromSelection(selectedNodeId);

    dispatch(updateTrajectoryNodes(plotUuid, [selectedNodeId], action));
  };

  const handleLassoSelection = (nodesInLasso) => {
    // const newSelectedNodes = [...new Set([...selectedNodes, ...nodesInLasso])];
    dispatch(updateTrajectoryNodes(plotUuid, nodesInLasso, 'add'));
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
        extraControlPanels={<TrajectoryExtraPanels experimentId={experimentId} setPlotState={setPlotState} plotState={plotState} />}
        onPlotReset={() => {
          setPlotState(initialPlotState);
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
