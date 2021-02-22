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
          value={yMax}
          min={0}
          max={yMax}
          onChange={(value) => {
            handleChange({ maxNegativeLogpValueDomain: value });
          }}
        />
      </Form.Item>
      <Form.Item
        label='X-axis Range'
      >
        <Slider
          value={xMax}
          min={0}
          max={xMax}
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
