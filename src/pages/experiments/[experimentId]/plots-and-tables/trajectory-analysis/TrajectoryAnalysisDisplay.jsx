import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import {
  Radio, Space,
} from 'antd';

const plotUuid = 'trajectoryAnalysisMain';

const TrajectoryAnalysisDisplay = (props) => {
  const { setPlotState, plotState } = props;

  const pseudotime = useSelector((state) => state.componentConfig[plotUuid]?.pseudotime);

  return (
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
          <Radio disabled={pseudotime} value>
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
  );
};

TrajectoryAnalysisDisplay.propTypes = {
  setPlotState: PropTypes.func.isRequired,
  plotState: PropTypes.object.isRequired,
};

export default TrajectoryAnalysisDisplay;
