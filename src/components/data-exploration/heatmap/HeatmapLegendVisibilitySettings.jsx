import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Radio } from 'antd';
import PropTypes from 'prop-types';

import { updatePlotConfig } from '../../../redux/actions/componentConfig';

const HeatmapLegendVisibilitySettings = (props) => {
  const dispatch = useDispatch();

  const { componentType } = props;

  const heatmapSettings = useSelector((state) => state.componentConfig[componentType].config) || {};

  const [showLegend, setShowLegend] = useState(heatmapSettings.legendIsVisible);

  const radioStyle = {
    display: 'block',
    padding: '5px',
    marginLeft: '0px',
  };

  const changelegend = (e) => {
    dispatch(
      updatePlotConfig(componentType, {
        legendIsVisible: e.target.value,
      }),
    );

    setShowLegend(e.target.value);
  };

  return (
    <Radio.Group value={showLegend} onChange={changelegend}>
      <Radio key='1' style={radioStyle} value>Show</Radio>
      <Radio key='2' style={radioStyle} value={false}>Hide</Radio>
    </Radio.Group>
  );
};

HeatmapLegendVisibilitySettings.defaultProps = {
};

HeatmapLegendVisibilitySettings.propTypes = {
  componentType: PropTypes.string.isRequired,
};

export default HeatmapLegendVisibilitySettings;
