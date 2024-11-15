import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import {
  Slider, Form, Input, Switch, Space, Radio,
} from 'antd';
import useUpdateThrottled from 'utils/customHooks/useUpdateThrottled';

const AxesDesign = (props) => {
  const { onUpdate, config } = props;
  const [newConfig, handleChange] = useUpdateThrottled(onUpdate, config, 200);

  return (
    <Form
      size='small'
      labelCol={{ span: 10, style: { textAlign: 'left' } }}
      wrapperCol={{ span: 11 }}
    >
      <p><strong>Toggle Axes</strong></p>
      <Form.Item>
        <Radio.Group
          value={config.axes.enabled}
          onChange={(e) => {
            handleChange({
              axes: { enabled: e.target.value },
            });
          }}
        >
          <Radio value>Show</Radio>
          <Radio value={false}>Hide</Radio>
        </Radio.Group>
      </Form.Item>
      {
        config.axes.enabled && (
          <>
            <p><strong>Axes Settings</strong></p>
            <Form.Item label='X-Axis Title'>
              <Input
                value={config.axes.xAxisText}
                onChange={(e) => {
                  handleChange({
                    axes: {
                      xAxisText: e.target.value,
                      defaultValues: _.without(config.axes.defaultValues, 'x'),
                    },
                  });
                }}
              />
            </Form.Item>

            <Form.Item label='Y-Axis Title'>
              <Input
                value={config.axes.yAxisText}
                onChange={(e) => {
                  handleChange({
                    axes: {
                      yAxisText: e.target.value,
                      defaultValues: _.without(config.axes.defaultValues, 'y'),
                    },
                  });
                }}
              />
            </Form.Item>

            <Form.Item label='Axes Title Size'>
              <Slider
                value={newConfig.axes.titleFontSize}
                min={5}
                max={21}
                onChange={(value) => {
                  handleChange({ axes: { titleFontSize: value } });
                }}
                marks={{ 5: 5, 21: 21 }}
              />
            </Form.Item>

            <Form.Item label='Rotate X-Axis Labels'>
              <Switch
                checked={newConfig.axes.xAxisRotateLabels}
                onChange={(checked) => {
                  handleChange({ axes: { xAxisRotateLabels: checked } });
                }}
              />
            </Form.Item>

            <Form.Item label='Axes Label Size'>
              <Slider
                value={newConfig.axes.labelFontSize}
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
                value={newConfig.axes.offset}
                min={0}
                max={20}
                onChange={(value) => {
                  handleChange({ axes: { offset: value } });
                }}
                marks={{ 0: 0, 20: 20 }}
              />
            </Form.Item>

            <Form.Item label='Grid Line Weight'>
              <Slider
                value={newConfig.axes.gridOpacity}
                min={0}
                max={10}
                onChange={(value) => {
                  handleChange({ axes: { gridOpacity: value } });
                }}
                marks={{ 0: 0, 10: 10 }}
              />
            </Form.Item>
          </>
        )
      }
    </Form>
  );
};

AxesDesign.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};

export default AxesDesign;
