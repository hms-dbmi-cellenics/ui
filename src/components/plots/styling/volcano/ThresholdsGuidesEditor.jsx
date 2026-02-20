import React from 'react';
import PropTypes from 'prop-types';
import {
  Form, Checkbox, Typography,
} from 'antd';
import _ from 'lodash';
import ColorPicker from 'components/ColorPicker';
import SliderWithInput from 'components/SliderWithInput';

const { Text } = Typography;

const ThresholdsGuidesEditor = (props) => {
  const { onUpdate, config } = props;

  const debouncedUpdate = _.debounce((update) => { onUpdate(update); }, 300);

  return (
    <>
      <Form
        size='small'
        labelCol={{ span: 9, style: { textAlign: 'left' } }}
        wrapperCol={{ span: 16 }}
      >
        <p><strong>Adjusted p-value:</strong></p>
        <Form.Item
          label='Threshold:'
          labelCol={{ span: 9, style: { textAlign: 'left' } }}
          wrapperCol={{ span: 15 }}
        >
          <SliderWithInput
            min={0.00001}
            max={0.5}
            step={0.001}
            value={config.adjPvalueThreshold}
            onUpdate={(val) => debouncedUpdate({ adjPvalueThreshold: val })}
          />
        </Form.Item>
        <Form.Item
          labelCol={{ span: 9 }}
          wrapperCol={{ span: 15 }}
        >
          <Text type='secondary'>
            -log₁₀(adj p-value) =
            {' '}
            {config.adjPvalueThreshold > 0 ? (-Math.log10(config.adjPvalueThreshold)).toPrecision(3) : 'Infinity'}
          </Text>
        </Form.Item>
        <Form.Item
          label='Show Guideline:'
          labelCol={{ span: 9, style: { textAlign: 'left' } }}
          wrapperCol={{ span: 15 }}
        >
          <Checkbox
            checked={config.showpvalueThresholdGuides}
            onChange={(e) => {
              onUpdate({ showpvalueThresholdGuides: e.target.checked });
            }}
          />
        </Form.Item>
        <Form.Item
          label='Guide Color:'
          labelCol={{ span: 9, style: { textAlign: 'left' } }}
          wrapperCol={{ span: 15 }}
        >
          <ColorPicker
            onColorChange={((color) => {
              onUpdate({
                pvalueThresholdColor: color,
              });
            })}
            color={config.pvalueThresholdColor}
            size='small'
          />
        </Form.Item>

        <p><strong>Fold change (log):</strong></p>
        <Form.Item
          label='Threshold:'
          labelCol={{ span: 9, style: { textAlign: 'left' } }}
          wrapperCol={{ span: 15 }}
        >
          <SliderWithInput
            min={0.01}
            max={5}
            step={0.01}
            value={config.logFoldChangeThreshold}
            onUpdate={(val) => debouncedUpdate({ logFoldChangeThreshold: val })}
          />
        </Form.Item>
        <Form.Item
          label='Show Guideline:'
          labelCol={{ span: 9, style: { textAlign: 'left' } }}
          wrapperCol={{ span: 15 }}
        >
          <Checkbox
            checked={config.showLogFoldChangeThresholdGuides}
            onChange={(e) => {
              onUpdate({ showLogFoldChangeThresholdGuides: e.target.checked });
            }}
          />
        </Form.Item>
        <Form.Item
          label='Guide Color:'
          labelCol={{ span: 9, style: { textAlign: 'left' } }}
          wrapperCol={{ span: 15 }}
        >
          <ColorPicker
            onColorChange={((color) => {
              onUpdate({
                logFoldChangeThresholdColor: color,
              });
            })}
            color={config.logFoldChangeThresholdColor}
            size='small'
          />
        </Form.Item>

        <p><strong>Guideline Design</strong></p>
        <Form.Item
          label='Width:'
          labelCol={{ span: 9, style: { textAlign: 'left' } }}
          wrapperCol={{ span: 15 }}
        >
          <SliderWithInput
            min={1}
            max={10}
            step={0.5}
            value={config.thresholdGuideWidth}
            onUpdate={(val) => debouncedUpdate({ thresholdGuideWidth: val })}
          />
        </Form.Item>
      </Form>
    </>
  );
};

ThresholdsGuidesEditor.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};

export default ThresholdsGuidesEditor;
