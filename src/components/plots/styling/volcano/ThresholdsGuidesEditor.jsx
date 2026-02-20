import React from 'react';
import PropTypes from 'prop-types';
import {
  Form, Checkbox, Space, Typography,
} from 'antd';
import _ from 'lodash';
import ColorPicker from 'components/ColorPicker';
import SliderWithInput from 'components/SliderWithInput';

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
          label='-log₁₀(adj p-value):'
        >
          <Space direction='vertical' style={{ width: '100%' }}>
            <Space>
              <SliderWithInput
                min={0.3}
                max={5}
                step={0.1}
                value={config.adjPvalueThreshold > 0 ? -Math.log10(config.adjPvalueThreshold) : 5}
                onUpdate={(val) => debouncedUpdate({ adjPvalueThreshold: Math.pow(10, -val) })}
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
              Adjusted p-value =
              {' '}
              {config.adjPvalueThreshold > 0 ? config.adjPvalueThreshold.toExponential(2) : '> 0.5'}
            </Text>
          </Space>
        </Form.Item>

        <Form.Item
          label='Fold change (log):'
        >
          <Space>
            <SliderWithInput
              min={0.01}
              max={5}
              step={0.01}
              value={config.logFoldChangeThreshold}
              onUpdate={(val) => debouncedUpdate({ logFoldChangeThreshold: val })}
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
          <SliderWithInput
            min={1}
            max={10}
            step={0.5}
            value={config.thresholdGuideWidth}
            onUpdate={(val) => debouncedUpdate({ thresholdGuideWidth: val })}
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
