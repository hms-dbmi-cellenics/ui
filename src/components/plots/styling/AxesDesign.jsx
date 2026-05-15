import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import {
  Form, Input, Switch, Checkbox,
} from 'antd';
import DebouncedSlider from './DebouncedSlider';
import DebouncedInput from './DebouncedInput';

const AxesDesign = (props) => {
  const { onUpdate, config, showAxisLabelsToggle = true, embeddingMethod, defaultXAxisText: propDefaultX = '', defaultYAxisText: propDefaultY = '' } = props;

  // Calculate default values based on embedding method (uppercase, no space)
  // Or use provided props if embeddingMethod is not available
  const defaultXAxisText = embeddingMethod ? `${embeddingMethod.toUpperCase()}1` : propDefaultX;
  const defaultYAxisText = embeddingMethod ? `${embeddingMethod.toUpperCase()}2` : propDefaultY;

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
                  onUpdate({
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
                  onUpdate({
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
        <DebouncedInput
          value={displayXAxisText}
          debounceMs={600}
          onUpdate={(value) => {
            onUpdate({
              axes: {
                xAxisText: value,
                defaultValues: _.without(config.axes.defaultValues, 'x'),
              },
            });
          }}
        />
      </Form.Item>

      <Form.Item label='Y-Axis Title'>
        <DebouncedInput
          value={displayYAxisText}
          debounceMs={600}
          onUpdate={(value) => {
            onUpdate({
              axes: {
                yAxisText: value,
                defaultValues: _.without(config.axes.defaultValues, 'y'),
              },
            });
          }}
        />
      </Form.Item>

      <Form.Item label='Rotate X-Axis Labels'>
        <Switch
          checked={config.axes.xAxisRotateLabels}
          onChange={(checked) => {
            onUpdate({ axes: { xAxisRotateLabels: checked } });
          }}
        />
      </Form.Item>

      <Form.Item label='Axes Title Size'>
        <DebouncedSlider
          value={config.axes.titleFontSize}
          min={5}
          max={21}
          path='axes.titleFontSize'
          onUpdate={onUpdate}
          debounceMs={300}
          marks={{ 5: 5, 21: 21 }}
        />
      </Form.Item>

      <Form.Item label='Axes Label Size'>
        <DebouncedSlider
          value={config.axes.labelFontSize}
          min={5}
          max={21}
          path='axes.labelFontSize'
          onUpdate={onUpdate}
          debounceMs={300}
          marks={{ 5: 5, 21: 21 }}
        />
      </Form.Item>

      <Form.Item label='Offset Margins'>
        <DebouncedSlider
          value={config.axes.offset}
          min={0}
          max={20}
          path='axes.offset'
          onUpdate={onUpdate}
          debounceMs={300}
          marks={{ 0: 0, 20: 20 }}
        />
      </Form.Item>

      <Form.Item label='Grid Line Weight'>
        <DebouncedSlider
          value={config.axes.gridOpacity}
          min={0}
          max={10}
          path='axes.gridOpacity'
          onUpdate={onUpdate}
          debounceMs={300}
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
  defaultXAxisText: PropTypes.string,
  defaultYAxisText: PropTypes.string,
};

export default AxesDesign;
