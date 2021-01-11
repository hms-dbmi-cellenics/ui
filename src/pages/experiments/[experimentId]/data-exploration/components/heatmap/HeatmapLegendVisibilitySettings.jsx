import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Radio } from 'antd';
import { updatePlotConfig } from '../../../../../../redux/actions/componentConfig';

const HeatmapLegendVisibilitySettings = () => {
  const dispatch = useDispatch();

  const heatmapSettings = useSelector((state) => state.componentConfig.interactiveHeatmap?.config) || {};

  const [showLegend, setShowLegend] = useState(heatmapSettings.legendIsVisible);

  const radioStyle = {
    display: 'block',
    padding: '5px',
    marginLeft: '0px',
  };

  const changelegend = (e) => {
    dispatch(
      updatePlotConfig('interactiveHeatmap', {
        legendIsVisible: e.target.value,
      })
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
};

export default HeatmapLegendVisibilitySettings;