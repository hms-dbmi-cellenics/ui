/* eslint-disable no-param-reassign */
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Button,
  Collapse,
  Space,
  Radio,
} from 'antd';
import {
  updatePlotConfig,
  loadPlotConfig,
} from 'redux/actions/componentConfig/index';
import Header from 'components/Header';
import TrajectoryAnalysisPlot from 'components/plots/TrajectoryAnalysisPlot';
import PlotContainer from 'components/plots/PlotContainer';
import { plotNames, plotTypes } from 'utils/constants';
import getTrajectoryGraph from 'components/plots/helpers/trajectory-analysis/getTrajectoryGraph';
import getPseudoTime from 'components/plots/helpers/trajectory-analysis/getPseudoTime';

const { Panel } = Collapse;

const plotUuid = 'trajectoryAnalysisMain';
const plotType = plotTypes.TRAJECTORY_ANALYSIS;

const TrajectoryAnalysisPage = ({ experimentId }) => {
  const dispatch = useDispatch();
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [resetToggle, setResetToggle] = useState(false);

  const {
    config,
    plotData,
  } = useSelector((state) => state.componentConfig[plotUuid]) || {};

  const { method: embeddingMethod } = useSelector(
    (state) => state.experimentSettings.originalProcessing
      ?.configureEmbedding?.embeddingSettings || {},
  );

  const {
    loading: embeddingLoading,
    error: embeddingError,
    ETag,
  } = useSelector((state) => state.embeddings[embeddingMethod]) || {};

  useEffect(() => {
    if (!config) dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
  }, []);

  useEffect(() => {
    if (
      !embeddingMethod
      || embeddingLoading
      || embeddingError
      || !ETag
    ) return;
    dispatch(getTrajectoryGraph(experimentId, plotUuid));
  }, [config, embeddingMethod, embeddingLoading]);

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
      <Panel header='Trajectory analysis' key='trajectory-analysis'>
        <p>
          {selectedNodes.length ? `${selectedNodes.length} nodes selected` : 'Select root nodes to get started'}
        </p>
        {selectedNodes.length > 0 && (
          <Space direction='vertical' style={{ width: '100%' }}>
            <Button
              block
              onClick={() => {
                setSelectedNodes([]);
                setResetToggle(!resetToggle);
              }}
            >
              Clear selection
            </Button>
            <Button
              type='primary'
              block
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
            value={config?.display.pseudotime}
            onChange={(e) => dispatch(
              updatePlotConfig(plotUuid, { display: { pseudotime: e.target.value } }),
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
            value={config?.display.trajectory}
            onChange={(e) => dispatch(
              updatePlotConfig(plotUuid, { display: { trajectory: e.target.value } }),
            )}
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

  const handleNodeSelection = (selectedNodeId) => {
    const updatedSelection = selectedNodes.includes(selectedNodeId)
      ? selectedNodes.filter((nodeId) => selectedNodeId !== nodeId)
      : [...selectedNodes, selectedNodeId];

    setSelectedNodes(updatedSelection);
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
        plotInfo='The trajectory analysis plot displays the result of trajectory analysis for the given cell set.'
        defaultActiveKey='trajectory-analysis'
      >
        <TrajectoryAnalysisPlot
          experimentId={experimentId}
          config={config}
          plotUuid={plotUuid}
          plotData={plotData}
          resetPlot={resetToggle}
          onUpdate={updatePlotWithChanges}
          onSelectNode={handleNodeSelection}
        />
      </PlotContainer>
    </>
  );
};
TrajectoryAnalysisPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default TrajectoryAnalysisPage;
