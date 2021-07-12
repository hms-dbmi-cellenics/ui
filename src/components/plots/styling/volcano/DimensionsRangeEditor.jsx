import React from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form, Space,
} from 'antd';
import DimensionsRangeEditor from '../DimensionsRangeEditor';
import useUpdateThrottled from '../../../../utils/customHooks/useUpdateThrottled';

const VolcanoDimensionsRangeEditor = (props) => {
  const {
    config, onUpdate, yMax, xMax,
  } = props;
  const [newConfig, handleChange] = useUpdateThrottled(onUpdate, config);

  const rangeFormatter = (value) => value === 0 ? 'Auto' : value.toString();

  return (
    <Space direction='vertical' style={{ width: '80%' }}>
      <DimensionsRangeEditor
        config={config}
        onUpdate={onUpdate}
      />
      <Form.Item
        label='Y-axis Range'
      >
        <Slider
          value={newConfig.maxNegativeLogpValueDomain}
          min={0}
          max={yMax}
          tipFormatter={rangeFormatter}
          onChange={(value) => {
            handleChange({ maxNegativeLogpValueDomain: value });
          }}
        />
      </Form.Item>
      <Form.Item
        label='X-axis Range'
      >
        <Slider
          value={newConfig.logFoldChangeDomain}
          min={0}
          max={xMax}
          tipFormatter={rangeFormatter}
          onChange={(value) => {
            handleChange({ logFoldChangeDomain: value });
          }}
        />
      </Form.Item>

    </Space>
  );
};

VolcanoDimensionsRangeEditor.propTypes = {
  config: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  yMax: PropTypes.number.isRequired,
  xMax: PropTypes.number.isRequired,
};

export default VolcanoDimensionsRangeEditor;
