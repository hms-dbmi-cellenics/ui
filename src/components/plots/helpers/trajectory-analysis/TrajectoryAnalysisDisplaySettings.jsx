import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import {
  Radio, Space, Tooltip,
} from 'antd';

const TrajectoryAnalysisDisplaySettings = (props) => {
  const { setDisplaySettings, displaySettings, plotUuid } = props;

  const pseudotime = useSelector((state) => state.componentConfig[plotUuid]?.plotData?.pseudotime);
  const startigNodes = useSelector((state) => state.componentConfig[plotUuid]?.plotData?.nodes);

  return (
    <Space direction='vertical'>
      <b>Trajectory</b>
      <Radio.Group
        value={displaySettings.showStartingNodes}
        onChange={(e) => {
          setDisplaySettings({
            ...displaySettings,
            showStartingNodes: e.target.value,
          });
        }}
      >
        <Space>
          <Tooltip title='Calculate root nodes under "Select data" to show trajectory'>
            <Radio disabled={!displaySettings.hasRunStartingNodes || !startigNodes} value>
              Show
            </Radio>
          </Tooltip>
          <Radio value={false}>Hide</Radio>
        </Space>
      </Radio.Group>
      <b>Plot values</b>
      <Radio.Group
        value={displaySettings.showPseudotimeValues}
        onChange={(e) => setDisplaySettings({
          ...displaySettings,
          showPseudotimeValues: e.target.value,
        })}
      >
        <Space>
          <Radio value={false}>Cell sets</Radio>
          <Tooltip title='Calculate pseudotime under "Trajectory analysis" to show pseudotime'>
            <Radio disabled={!displaySettings.hasRunPseudotime || !pseudotime} value>
              Pseudotime
            </Radio>
          </Tooltip>
        </Space>
      </Radio.Group>
    </Space>
  );
};

TrajectoryAnalysisDisplaySettings.propTypes = {
  setDisplaySettings: PropTypes.func.isRequired,
  displaySettings: PropTypes.object.isRequired,
  plotUuid: PropTypes.string.isRequired,
};

export default TrajectoryAnalysisDisplaySettings;
