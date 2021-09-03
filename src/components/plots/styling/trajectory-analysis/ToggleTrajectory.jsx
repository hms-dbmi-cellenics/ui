import React from 'react';
import PropTypes from 'prop-types';
import {
  Space,
  Radio,
} from 'antd';

const ToggleTrajectory = (props) => {
  const { onUpdate, config } = props;

  const handleChange = (e) => {
    onUpdate({ showTrajectory: e.target.value });
  };

  return (
    <>
      <Space size='small' direction='vertical'>
        <p>Show Trajectory</p>
        <Radio.Group onChange={handleChange} defaultValue={config.showTrajectory}>
          <Radio value>Show</Radio>
          <Radio value={false}>Hide</Radio>
        </Radio.Group>
      </Space>
    </>
  );
};

ToggleTrajectory.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};
export default ToggleTrajectory;
