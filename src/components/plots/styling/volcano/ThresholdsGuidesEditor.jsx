import React from 'react';
import PropTypes from 'prop-types';
import {
  Form, Slider, InputNumber, Checkbox, Space, Typography,
} from 'antd';
import _ from 'lodash';
import ColorPicker from 'components/ColorPicker';

const { Text } = Typography;

const ThresholdsGuidesEditor = (props) => {
  const { onUpdate, config } = props;

  const colorPickerOptions = [
    {
      config: 'pvalueThresholdColor',
      name: 'P-value Guide',
    },
    {
      config: 'logFoldChangeThresholdColor',
      name: 'Fold Change Guide',
    },
  ];

  const debouncedUpdate = _.debounce((update) => { onUpdate(update); }, 300);

  return (
    <>
      <Form
        size='small'
        labelCol={{ span: 9, style: { textAlign: 'left' } }}
        wrapperCol={{ span: 16 }}
      >
        <p><strong>Significance Thresholds</strong></p>
        <Form.Item
          label='Adjusted p-value:'
        >
          <Space direction='vertical' style={{ width: '100%' }}>
            <Space direction='vertical' style={{ width: '100%' }}>
              <Slider
                min={0.00001}
                max={1}
                value={config.adjPvalueThreshold}
                step={0.01}
                onChange={(val) => debouncedUpdate({ adjPvalueThreshold: val })}
                marks={{
                  0.00001: '0',
                  1: '1',
                }}
              />
              <Checkbox
                checked={config.showpvalueThresholdGuides}
                onChange={(e) => {
                  onUpdate({ showpvalueThresholdGuides: e.target.checked });
                }}
              >
                Show Guideline
              </Checkbox>
            </Space>
            <Text type='secondary'>
              -log10(adj p-value) =
              {' '}
              {config.adjPvalueThreshold > 0 ? (-Math.log10(config.adjPvalueThreshold)).toPrecision(3) : 'Infinity'}
            </Text>
          </Space>
        </Form.Item>

        <Form.Item
          label='Fold change (log):'
        >
          <Space direction='vertical' style={{ width: '100%' }}>
            <Slider
              min={0.01}
              max={5}
              value={config.logFoldChangeThreshold}
              step={0.01}
              onChange={(val) => debouncedUpdate({ logFoldChangeThreshold: val })}
              marks={{
                0.01: '0',
                5: '5',
              }}
            />
            <Checkbox
              checked={config.showLogFoldChangeThresholdGuides}
              onChange={(e) => {
                onUpdate({ showLogFoldChangeThresholdGuides: e.target.checked });
              }}
            >
              Show Guideline
            </Checkbox>
          </Space>
        </Form.Item>

        <p><strong>Guideline Design</strong></p>
        <Form.Item
          label='Width:'
        >
          <InputNumber
            min={1}
            value={config.thresholdGuideWidth}
            type='number'
            onChange={(val) => debouncedUpdate({ thresholdGuideWidth: val })}
          />
        </Form.Item>

        {colorPickerOptions.map(({ config: configName, name: text }) => (
          <Form.Item
            key={`${configName}-${config[configName]}`}
            label={`${text}:`}
            labelCol={{ span: 9, style: { textAlign: 'left' } }}
            wrapperCol={{ span: 14 }}
          >
            <ColorPicker
              onColorChange={((color) => {
                onUpdate({
                  [configName]: color,
                });
              })}
              color={config[configName]}
              size='small'
            />
          </Form.Item>
        ))}
      </Form>
    </>
  );
};

ThresholdsGuidesEditor.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};

export default ThresholdsGuidesEditor;
