import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';

const MarkerHeatmapPlot = ({ experimentId }) => {
  const dispatch = useDispatch();
};

MarkerHeatmapPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default MarkerHeatmapPlot;
