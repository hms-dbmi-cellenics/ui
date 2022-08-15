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
import Loader from 'components/Loader';
import { loadEmbedding } from 'redux/actions/embedding';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';
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
  const {
    config,
    loading: configLoading,
    plotData,
  } = useSelector((state) => state.componentConfig[plotUuid]) || {};

  const [resetToggle, setResetToggle] = useState([]);

  const { method: embeddingMethod } = useSelector(
    (state) => state.experimentSettings.originalProcessing
      ?.configureEmbedding?.embeddingSettings || {},
  );

  const {
    data: embeddingData,
    loading: embeddingLoading,
    error: embeddingError,
  } = useSelector((state) => state.embeddings[embeddingMethod]) || {};

  useEffect(() => {
    if (!config) dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    if (!embeddingMethod) dispatch(loadProcessingSettings(experimentId));
  }, []);

  useEffect(() => {
    if (embeddingMethod && embeddingData?.length === 0) {
      dispatch(loadEmbedding(experimentId, embeddingMethod));
    }
  }, [embeddingMethod]);

  useEffect(() => {
    if (
      !embeddingMethod
      || embeddingLoading
      || embeddingError
      || !embeddingData?.length
    ) return;
    dispatch(getTrajectoryGraph(experimentId, plotUuid));
  }, [config, embeddingMethod, embeddingLoading]);

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };

  const {
    selectedNodes,
  } = config || {};

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
        <p>
          {selectedNodes.length ? `${selectedNodes.length} nodes selected` : 'Select root nodes to get started'}
        </p>
        {selectedNodes.length > 0 && (
          <Space direction='vertical' style={{ width: '100%' }}>
            <Button
              block
              disabled={configLoading}
              onClick={() => {
                dispatch(updatePlotConfig(plotUuid, { selectedNodes: [] }));
                setResetToggle(!resetToggle);
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
                dispatch(updatePlotConfig(plotUuid, { display: { pseudotime: true } }));
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
            value={config?.display?.pseudotime}
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
            value={config?.display?.trajectory}
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
        plotInfo='The trajectory analysis plot displays the result of trajectory analysis for the given cell set.'
        defaultActiveKey='trajectory-analysis'
      >
        <TrajectoryAnalysisPlot
          experimentId={experimentId}
          plotUuid={plotUuid}
          resetPlot={resetToggle}
          onUpdate={updatePlotWithChanges}
          onClickNode={clickNode}
          onSelectNodes={addNodes}
        />
      </PlotContainer>
    </>
  );
};
TrajectoryAnalysisPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default TrajectoryAnalysisPage;
