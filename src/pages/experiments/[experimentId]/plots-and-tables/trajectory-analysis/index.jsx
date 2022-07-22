/* eslint-disable no-param-reassign */
import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import _ from 'lodash';

import { getCellSets } from 'redux/selectors';
import {
  updatePlotConfig,
  loadPlotConfig,
} from 'redux/actions/componentConfig/index';
import Header from 'components/Header';
import { loadCellSets } from 'redux/actions/cellSets';
import TrajectoryAnalysisPlot from 'components/plots/TrajectoryAnalysisPlot';
import PlotContainer from 'components/plots/PlotContainer';
// import SelectData from 'components/plots/styling/SelectData';
import { plotNames, plotTypes } from 'utils/constants';
import getTrajectoryGraph from 'components/plots/helpers/trajectory-analysis/getTrajectoryGraph';

// const { Panel } = Collapse;

const plotUuid = 'trajectoryAnalysisMain';
const plotType = plotTypes.TRAJECTORY_ANALYSIS;

const TrajectoryAnalysisPage = ({ experimentId }) => {
  const dispatch = useDispatch();
  const {
    config,
    plotData,
  } = useSelector((state) => state.componentConfig[plotUuid]) || {};

  const embeddingSettings = useSelector(
    (state) => state.experimentSettings.originalProcessing?.configureEmbedding?.embeddingSettings,
  );

  const {
    loading: embeddingLoading,
    error: embeddingError,
  } = useSelector((state) => state.embeddings[embeddingSettings?.method]) || {};

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

  const {
    ETag,
  } = useSelector((state) => state.embeddings?.umap || {});

  useEffect(() => {
    if (cellSetsLoading
      || cellSetsError
      || !embeddingSettings
      || embeddingLoading
      || embeddingError
      || !ETag
    ) return;

    const currentComparedConfig = getComparedConfig(config);

    if (config && !_.isEqual(previousComparedConfig.current, currentComparedConfig)) {
      previousComparedConfig.current = currentComparedConfig;
      dispatch(getTrajectoryGraph(experimentId, plotUuid));
    }
  }, [config, cellSetsLoading, embeddingSettings, embeddingLoading]);

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
        />
      </PlotContainer>
    </>
  );
};
TrajectoryAnalysisPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default TrajectoryAnalysisPage;
