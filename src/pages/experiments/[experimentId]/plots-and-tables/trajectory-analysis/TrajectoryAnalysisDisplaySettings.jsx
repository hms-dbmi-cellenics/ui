import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import {
  Radio, Space,
} from 'antd';

const TrajectoryAnalysisDisplaySettings = (props) => {
  const { setDisplaySettings, displaySettings, plotUuid } = props;

  const pseudotime = useSelector((state) => state.componentConfig[plotUuid]?.plotData?.pseudotime);

  return (
    <Space direction='vertical'>
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
          <Radio disabled={!pseudotime} value>
            Pseudotime
          </Radio>
        </Space>
      </Radio.Group>
      <b>Starting nodes</b>
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
          <Radio value>Show</Radio>
          <Radio value={false}>Hide</Radio>
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
