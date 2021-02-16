import _ from 'lodash';
import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Slider, Form, Input,
} from 'antd';

const AxesDesign = (props) => {
  const { onUpdate, config } = props;
  const onUpdateThrottled = useCallback(_.throttle((obj) => onUpdate(obj), 70), []);
  const [newConfig, setNewConfig] = useState(config);
  const handleChange = (object) => {
    const change = _.cloneDeep(newConfig);
    _.merge(change, object);
    setNewConfig(change);
    onUpdateThrottled(object);
  };
  return (
    <Form
      size='small'
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 12 }}
    >
      <Form.Item label='Axes Label Size'>
        <Slider
          value={config.axes.titleFontSize}
          min={5}
          max={21}
          onChange={(value) => {
            handleChange({ axes: { titleFontSize: value } });
          }}
          marks={{ 5: 5, 21: 21 }}
        />
      </Form.Item>

      <Form.Item label='Axes Ticks Size'>
        <Slider
          value={config.axes.labelFontSize}
          min={5}
          max={21}
          onChange={(value) => {
            handleChange({ axes: { labelFontSize: value } });
          }}
          marks={{ 5: 5, 21: 21 }}
        />
      </Form.Item>

      <Form.Item label='Offset Margins'>
        <Slider
          value={config.axes.offset}
          min={0}
          max={20}
          onChange={(value) => {
            handleChange({ axes: { offset: value } });
          }}
          marks={{ 0: 0, 20: 20 }}
        />
      </Form.Item>

      <Form.Item label='Grid-line weight'>
        <Slider
          value={config.axes.gridOpacity}
          min={0}
          max={10}
          onChange={(value) => {
            handleChange({ axes: { gridOpacity: value } });
          }}
          marks={{ 0: 0, 10: 10 }}
        />
      </Form.Item>

      <Form.Item label='X axis Title'>
        <Input
          value={config.axes.xAxisText}
          onChange={(e) => {
            handleChange({ axes: { xAxisText: e.target.value } });
          }}
        />
      </Form.Item>

      <Form.Item label='Y Axis Title'>
        <Input
          value={config.axes.yAxisText}
          onChange={(e) => {
            handleChange({ axes: { yAxisText: e.target.value } });
          }}
        />
      </Form.Item>
    </Form>
  );
};

AxesDesign.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};

export default AxesDesign;
