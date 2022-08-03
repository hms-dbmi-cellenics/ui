/* eslint-disable no-param-reassign */
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';

import {
  updatePlotConfig,
  loadPlotConfig,
} from 'redux/actions/componentConfig/index';
import Header from 'components/Header';
import TrajectoryAnalysisPlot from 'components/plots/TrajectoryAnalysisPlot';
import PlotContainer from 'components/plots/PlotContainer';
import { plotNames, plotTypes } from 'utils/constants';
import getTrajectoryGraph from 'components/plots/helpers/trajectory-analysis/getTrajectoryGraph';

const plotUuid = 'trajectoryAnalysisMain';
const plotType = plotTypes.TRAJECTORY_ANALYSIS;

const TrajectoryAnalysisPage = ({ experimentId }) => {
  const dispatch = useDispatch();
  const [selectedNodes, setSelectedNodes] = useState([]);

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

  return (
    <>
      <Header title={plotNames.TRAJECTORY_ANALYSIS} />
      <PlotContainer
        experimentId={experimentId}
        plotUuid={plotUuid}
        plotType={plotType}
        plotStylingConfig={plotStylingConfig}
        plotInfo='The trajectory analysis plot displays the result of trajectory analysis for the given cell set.'
        defaultActiveKey='group-by'
      >
        <TrajectoryAnalysisPlot
          experimentId={experimentId}
          config={config}
          plotUuid={plotUuid}
          plotData={plotData}
          onUpdate={updatePlotWithChanges}
          onSelectNode={(nodeId) => {
            setSelectedNodes(
              [...selectedNodes, nodeId],
            );
          }}
        />
      </PlotContainer>
    </>
  );
};
TrajectoryAnalysisPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default TrajectoryAnalysisPage;
