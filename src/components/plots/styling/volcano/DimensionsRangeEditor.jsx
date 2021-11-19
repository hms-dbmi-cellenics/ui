import React from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form, Space, Checkbox,
} from 'antd';
import DimensionsRangeEditor from 'components/plots/styling/DimensionsRangeEditor';
import useUpdateThrottled from 'utils/customHooks/useUpdateThrottled';

const VolcanoDimensionsRangeEditor = (props) => {
  const {
    config, onUpdate, yMax, xMax,
  } = props;
  const [newConfig, handleChange] = useUpdateThrottled(onUpdate, config);

  const rangeFormatter = (value) => (value === 0 ? 'Auto' : value.toString());

  // yMin has to be set to reasonable value to avoid plot blowing up
  // when yMin is too small and the max data value is too high
  const yMin = Math.round(0.3 * yMax);

  return (
    <Space direction='vertical' style={{ width: '80%' }}>
      <DimensionsRangeEditor
        config={config}
        onUpdate={onUpdate}
      />
      <Form.Item
        label='Y-Axis Range'
      >
        <Checkbox
          onChange={() => {
            onUpdate({ yAxisAuto: !config.yAxisAuto });
          }}
          defaultChecked
          checked={config.yAxisAuto}
        >
          Auto
        </Checkbox>
        <Slider
          value={newConfig.maxNegativeLogpValueDomain}
          min={yMin}
          max={yMax}
          onChange={(value) => {
            handleChange({ maxNegativeLogpValueDomain: value });
          }}
          disabled={config.yAxisAuto}
        />
      </Form.Item>
      <Form.Item
        label='X-Axis Range'
      >
        <Checkbox
          onChange={() => {
            onUpdate({ xAxisAuto: !config.xAxisAuto });
          }}
          checked={config.xAxisAuto}
          defaultChecked
        >
          Auto
        </Checkbox>
        <Slider
          value={newConfig.logFoldChangeDomain}
          min={1}
          max={xMax}
          tipFormatter={rangeFormatter}
          onChange={(value) => {
            handleChange({ logFoldChangeDomain: value });
          }}
          disabled={config.xAxisAuto}
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
