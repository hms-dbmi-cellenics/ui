/* eslint-disable no-param-reassign */
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Button,
  Collapse,
  Space,
  Radio,
  Alert,
} from 'antd';
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
import getTrajectoryPlotPseudoTime from 'redux/actions/componentConfig/getTrajectoryPlotPseudoTime';

import Header from 'components/Header';
import PlotContainer from 'components/plots/PlotContainer';
import TrajectoryAnalysisPlot from 'components/plots/TrajectoryAnalysisPlot';
import PlatformError from 'components/PlatformError';

import { plotNames, plotTypes } from 'utils/constants';
import useConditionalEffect from 'utils/customHooks/useConditionalEffect';

const { Panel } = Collapse;

const plotUuid = 'trajectoryAnalysisMain';
const plotType = plotTypes.TRAJECTORY_ANALYSIS;

const initialPlotState = {
  displayTrajectory: true,
  displayPseudotime: false,
  hasRunPseudotime: false,
  isZoomedOrPanned: false,
};

const TrajectoryAnalysisPage = ({ experimentId }) => {
  const dispatch = useDispatch();
  const [plotState, setPlotState] = useState(initialPlotState);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Currenty monocle3 trajectory analysis only supports
  // UMAP embedding. Therefore, this embedding is specifically fetched.
  const embeddingMethod = 'umap';

  const cellSets = useSelector(getCellSets());

  const {
    config,
    loading: configLoading,
    plotData,
    loading: plotLoading,
    error: plotDataError,
  } = useSelector((state) => state.componentConfig[plotUuid]) || {};

  const { selectedNodes } = config || {};

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
    if (!config) {
      dispatch(loadPlotConfig(experimentId, plotUuid, plotType)).then(() => {
        setConfigLoaded(true);
      });
    } else { setConfigLoaded(true); }
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

  useEffect(() => {
    if (plotState.isZoomedOrPanned) {
      setPlotState({
        ...plotState,
        isZoomedOrPanned: false,
      });
    }
  }, [config?.axesRanges?.xAxisAuto, config?.axesRanges?.xAxisAuto]);

  useConditionalEffect(() => {
    if (
      // `configLoaded` is used instead of `config` because this block of code should only be called
      // once when the config is loaded, or when embedding settings changes. Using `config`
      // in the dependency array will make this code be executed everytime there is a config change.
      !configLoaded
      || !embeddingMethod
      || embeddingLoading
      || embeddingError
      || !embeddingData?.length
    ) return;
    dispatch(getTrajectoryPlotStartingNodes(experimentId, plotUuid));
  }, [
    configLoaded,
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

    if (!config
      || embeddingLoading
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
        experimentId={experimentId}
        config={config}
        onUpdate={updatePlotWithChanges}
        plotState={plotState}
        plotData={plotData}
        plotLoading={plotLoading}
        plotDataError={plotDataError}
        onClickNode={handleClickNode}
        onLassoSelection={handleLassoSelection}
        onZoomOrPan={() => {
          if (!plotState.isZoomedOrPanned) {
            setPlotState({
              ...plotState,
              isZoomedOrPanned: true,
            });
          }
        }}
        actions={{ export: true, editor: false, source: false }}
      />
    );
  };

  const renderExtraPanels = () => (
    <>
      <Panel header='Trajectory analysis' key='trajectory-analysis'>
        {
          plotState.displayTrajectory ? (
            <Space direction='vertical' style={{ width: '100%' }}>
              <Alert
                type='info'
                message={(
                  <>
                    <p>
                      To get started, select root nodes by
                      {' '}
                      <strong>clicking on the white points</strong>
                      . You can select multiple nodes at once by drawing a selection. To do this,
                      {' '}
                      <strong>
                        hold down the Shift key, and then click and drag
                      </strong>
                      . Nodes inside the selection will be added to the selection.
                    </p>
                    <p>
                      Move around the plot by panning (click and drag) and zooming (pinch and zoom/scroll).
                    </p>
                    <p>
                      Deselect nodes by clicking on a selected node, or by clicking
                      {' '}
                      <strong>Clear selection</strong>
                      .
                    </p>
                  </>
                )}
              />
              {selectedNodes?.length > 0 && (
                <>
                  <strong>{`${selectedNodes.length} nodes selected`}</strong>
                  <Button
                    block
                    disabled={configLoading}
                    onClick={() => {
                      dispatch(updatePlotConfig(plotUuid, { selectedNodes: [] }));
                    }}
                  >
                    Clear selection
                  </Button>
                  <Button
                    type='primary'
                    block
                    disabled={configLoading}
                    onClick={async () => {
                      // Optimistic result to prevent flickering
                      setPlotState({
                        ...plotState,
                        displayPseudotime: true,
                        hasRunPseudotime: true,
                      });

                      const success = await dispatch(getTrajectoryPlotPseudoTime(selectedNodes, experimentId, plotUuid));
                      if (!success) {
                        setPlotState({
                          ...plotState,
                          displayPseudotime: false,
                          hasRunPseudotime: false,
                        });
                      }
                    }}
                  >
                    {plotState.hasRunPseudotime ? 'Recalculate' : 'Calculate'}
                  </Button>
                </>
              )}
            </Space>
          ) : (
            <p>
              Choose
              {' '}
              <strong>Trajectory > Show</strong>
              {' '}
              under
              {' '}
              <strong>Display</strong>
              {' '}
              to show the trajectory path.
            </p>
          )
        }
      </Panel>
      <Panel header='Display' key='display'>
        <Space
          style={{ marginLeft: '5%' }}
          direction='vertical'
        >
          <b>Plot values</b>
          <Radio.Group
            value={plotState.displayPseudotime}
            onChange={(e) => setPlotState({
              ...plotState,
              displayPseudotime: e.target.value,
            })}
          >
            <Space>
              <Radio value={false}>Clusters</Radio>
              <Radio disabled={!plotData?.pseudotime} value>
                Pseudotime
              </Radio>
            </Space>
          </Radio.Group>
          <b>Trajectory</b>
          <Radio.Group
            value={plotState.displayTrajectory}
            onChange={(e) => {
              setPlotState({
                ...plotState,
                displayTrajectory: e.target.value,
              });
            }}
          >
            <Space>
              <Radio value>Show</Radio>
              <Radio value={false}>Hide</Radio>
            </Space>
          </Radio.Group>
        </Space>
      </Panel>
    </>
  );

  const renderExtraToolbarControls = () => (
    <>
      <Button
        size='small'
        disabled={!plotState.isZoomedOrPanned}
        onClick={() => { setPlotState({ ...plotState, isZoomedOrPanned: false }); }}
      >
        Reset Zoom
      </Button>
    </>
  );

  const handleClickNode = (action, selectedNodeId) => {
    const removeFromSelection = (nodeId) => selectedNodes.filter((node) => nodeId !== node);
    const addToSelection = (nodeId) => [...selectedNodes, nodeId];

    const updatedSelection = action === 'add'
      ? addToSelection(selectedNodeId)
      : removeFromSelection(selectedNodeId);

    dispatch(updatePlotConfig(plotUuid, { selectedNodes: updatedSelection }));
  };

  const handleLassoSelection = (nodesInLasso) => {
    const newSelectedNodes = [...new Set([...selectedNodes, ...nodesInLasso])];
    dispatch(updatePlotConfig(plotUuid, { selectedNodes: newSelectedNodes }));
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
        extraControlPanels={renderExtraPanels()}
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
