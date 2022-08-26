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
import getStartingNodes from 'redux/actions/componentConfig/getTrajectoryPlotStartingNodes';
import getPseudoTime from 'redux/actions/componentConfig/getTrajectoryPlotPseudoTime';

import Header from 'components/Header';
import PlotContainer from 'components/plots/PlotContainer';
import TrajectoryAnalysisPlot from 'components/plots/TrajectoryAnalysisPlot';
import { plotNames, plotTypes } from 'utils/constants';

const { Panel } = Collapse;

const plotUuid = 'trajectoryAnalysisMain';
const plotType = plotTypes.TRAJECTORY_ANALYSIS;

const initialPlotState = {
  displayTrajectory: true,
  displayPseudotime: false,
  isZoomOrPanned: false,
};

const TrajectoryAnalysisPage = ({ experimentId }) => {
  const dispatch = useDispatch();
  const [resetPlot, setResetPlot] = useState(false);
  const [plotState, setPlotState] = useState(initialPlotState);

  // Currenty monocle3 trajectory analysis only supports
  // UMAP embedding. Therefore, this embedding is specifically fetched.
  const embeddingMethod = 'umap';

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
    if (!config) dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    dispatch(loadProcessingSettings(experimentId));
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
    if (
      !embeddingMethod
      || embeddingLoading
      || embeddingError
      || !embeddingData?.length
    ) return;
    dispatch(getStartingNodes(experimentId, plotUuid));
  }, [embeddingMethod, embeddingLoading, embeddingSettings]);

  useEffect(() => {
    if (
      !selectedNodes?.length
      || !embeddingMethod
      || embeddingLoading
      || embeddingError
      || !embeddingData?.length
    ) return;

    dispatch(getPseudoTime(selectedNodes, experimentId, plotUuid));
  }, [selectedNodes]);

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

  if (!config) return <Loader />;

  const renderExtraPanels = () => (
    <>
      <Panel header='Trajectory analysis' key='trajectory-analysis'>
        <Space direction='vertical'>
          {
            plotState.displayTrajectory && (
              <Alert
                type='info'
                message={(
                  <>
                    <p>
                      To get started, select root nodes by
                      {' '}
                      <strong>clicking on the white points</strong>
                      . You can select multiple nodes by drawing a selection. To do this,
                      {' '}
                      <strong>
                        hold down the Shift key, and then hold click and drag
                      </strong>
                      . Nodes inside the selection will be added to the selection.
                    </p>
                    <p>
                      Move around the plot by panning (clicking and dragging) and zooming (scrolling).
                    </p>
                    <p>
                      Deselect nodes by clicking on a selected node, or by clicking
                      {' '}
                      <strong>Clear Selection</strong>
                      .
                    </p>
                  </>
                )}
              />
            )
          }
          <p>
            <strong>
              {selectedNodes.length ? `${selectedNodes.length} nodes selected` : ''}
            </strong>
          </p>
        </Space>
        {selectedNodes.length > 0 && (
          <Space direction='vertical' style={{ width: '100%' }}>
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
              onClick={() => {
                dispatch(getPseudoTime(selectedNodes, experimentId, plotUuid));
              }}
            >
              Calculate
            </Button>
          </Space>
        ) }
      </Panel>
      <Panel header='Display' key='display'>
        <Space
          style={{ marginLeft: '5%' }}
          direction='vertical'
        >
          <b>Plot values</b>
          <Radio.Group
            value={plotState.displayPseudotime}
            onChange={(e) => dispatch(
              setPlotState({
                ...plotState,
                displayPseudotime: e.target.value,
              }),
            )}
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

  const clickNode = (selectedNodeId) => {
    const updatedSelection = selectedNodes.includes(selectedNodeId)
      ? selectedNodes.filter((nodeId) => selectedNodeId !== nodeId)
      : [...selectedNodes, selectedNodeId];

    dispatch(updatePlotConfig(plotUuid, { selectedNodes: updatedSelection }));
  };

  const addNodes = (nodesInSelection) => {
    const updatedSelection = [...new Set([...selectedNodes, ...nodesInSelection])];
    dispatch(updatePlotConfig(plotUuid, { selectedNodes: updatedSelection }));
  };

  return (
    <>
      <Header title={plotNames.TRAJECTORY_ANALYSIS} />
      <PlotContainer
        experimentId={experimentId}
        plotUuid={plotUuid}
        plotType={plotType}
        plotStylingConfig={plotStylingConfig}
        extraControlPanels={renderExtraPanels()}
        resetPlot={resetPlot}
        onPlotReset={() => {
          setResetPlot(false);
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
      >
        <TrajectoryAnalysisPlot
          experimentId={experimentId}
          config={config}
          onUpdate={updatePlotWithChanges}
          plotState={plotState}
          plotData={plotData}
          plotLoading={plotLoading}
          plotDataError={plotDataError}
          onPlotDataErrorRetry={() => dispatch(getStartingNodes(experimentId, plotUuid))}
          onClickNode={clickNode}
          onSelectNodes={addNodes}
          onZoomOrPan={() => {
            if (!plotState.isZoomOrPanned) {
              setPlotState({
                ...plotState,
                isZoomOrPanned: true,
              });
            }
            if (!resetPlot) {
              setResetPlot(true);
            }
          }}
          actions={{ export: true, editor: true, source: false }}
        />
      </PlotContainer>
    </>
  );
};
TrajectoryAnalysisPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default TrajectoryAnalysisPage;
