/* eslint-disable import/no-unresolved */

import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import populateHeatmapData from 'components/plots/helpers/populateHeatmapData';
import { updatePlotConfig, loadPlotConfig } from 'redux/actions/componentConfig';

const plotUuid = 'markerHeatmapPlotMain';
const plotType = 'marker-heatmap';

const route = {
  path: 'marker-heatmap',
  breadcrumbName: 'Marker-Heatmap',
};

const MarkerHeatmapPlot = ({ experimentId }) => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const { expression: expressionData } = useSelector((state) => state.genes);
  const { error, loading } = expressionData;

  useEffect(() => {
    dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
  }, []);
};

MarkerHeatmapPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default MarkerHeatmapPlot;
