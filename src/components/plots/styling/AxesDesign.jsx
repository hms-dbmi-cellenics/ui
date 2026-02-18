import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import {
  Slider, Form, Input, Switch, Checkbox,
} from 'antd';
import useUpdateThrottled from 'utils/customHooks/useUpdateThrottled';

const AxesDesign = (props) => {
  const { onUpdate, config, showAxisLabelsToggle = true, embeddingMethod } = props;
  const [newConfig, handleChange] = useUpdateThrottled(onUpdate, config, 200);

  // Calculate default values based on embedding method (uppercase, no space)
  const defaultXAxisText = embeddingMethod ? `${embeddingMethod.toUpperCase()}1` : '';
  const defaultYAxisText = embeddingMethod ? `${embeddingMethod.toUpperCase()}2` : '';

  // Show default only if axis is still marked as using default, otherwise show actual config value
  const displayXAxisText = config.axes.defaultValues?.includes('x') 
    ? defaultXAxisText 
    : config.axes.xAxisText;
  const displayYAxisText = config.axes.defaultValues?.includes('y')
    ? defaultYAxisText
    : config.axes.yAxisText;

  return (
    <Form
      size='small'
      labelCol={{ span: 10, style: { textAlign: 'left' } }}
      wrapperCol={{ span: 11 }}
    >
      {showAxisLabelsToggle !== false && (
        <>
          <p><strong>Toggle Axes:</strong></p>
          <Form.Item>
            <div style={{ display: 'flex', gap: '16px' }}>
              <Checkbox
                checked={config.axes.xAxisLabels}
                onChange={(e) => {
                  handleChange({
                    axes: { xAxisLabels: e.target.checked },
                  });
                }}
                style={{ whiteSpace: 'nowrap' }}
              >
                X-Axis Labels
              </Checkbox>
              <Checkbox
                checked={config.axes.yAxisLabels}
                onChange={(e) => {
                  handleChange({
                    axes: { yAxisLabels: e.target.checked },
                  });
                }}
                style={{ whiteSpace: 'nowrap' }}
              >
                Y-Axis Labels
              </Checkbox>
            </div>
          </Form.Item>
        </>
      )}
      <p><strong>Axes Settings:</strong></p>
      <Form.Item label='X-Axis Title'>
        <Input
          value={displayXAxisText}
          onChange={(e) => handleChange({
            axes: {
              xAxisText: e.target.value,
              defaultValues: _.without(config.axes.defaultValues, 'x'),
            },
          })}
        />
      </Form.Item>

      <Form.Item label='Y-Axis Title'>
        <Input
          value={displayYAxisText}
          onChange={(e) => handleChange({
            axes: {
              yAxisText: e.target.value,
              defaultValues: _.without(config.axes.defaultValues, 'y'),
            },
          })}
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
    </Form>
  );
};

AxesDesign.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  showAxisLabelsToggle: PropTypes.bool,
  embeddingMethod: PropTypes.string,
};

export default AxesDesign;
