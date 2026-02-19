import React from 'react';
import PropTypes from 'prop-types';
import {
  Form, InputNumber, Checkbox, Space, Typography,
} from 'antd';
import _ from 'lodash';
import ColorPicker from 'components/ColorPicker';

const { Text } = Typography;

const ThresholdsGuidesEditor = (props) => {
  const { onUpdate, config } = props;

  const colorPickerOptions = [
    {
      config: 'pvalueThresholdColor',
      name: 'p-value guide',
    },
    {
      config: 'logFoldChangeThresholdColor',
      name: 'fold change guide',
    },
  ];

  const debouncedUpdate = _.debounce((update) => { onUpdate(update); }, 300);

  return (
    <>
      <Form
        size='small'
        labelCol={{ span: 8, style: { textAlign: 'left' } }}
        wrapperCol={{ span: 16 }}
      >
        <p><strong>Significance Thresholds</strong></p>
        <Form.Item
          label='Adjusted p-value:'
        >
          <Space direction='vertical' style={{ width: '100%' }}>
            <Space>
              <InputNumber
                min={0}
                value={config.adjPvalueThreshold}
                step={1}
                type='number'
                onChange={(val) => debouncedUpdate({ adjPvalueThreshold: val })}
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
              {-Math.log10(config.adjPvalueThreshold).toPrecision(3)}
            </Text>
          </Space>
        </Form.Item>

        <Form.Item
          label='Fold change (log):'
        >
          <Space>
            <InputNumber
              min={0}
              step={0.1}
              value={config.logFoldChangeThreshold}
              onChange={(val) => debouncedUpdate({ logFoldChangeThreshold: val })}
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
            key={configName}
            label={`${text}:`}
          >
            <ColorPicker
              onColorChange={((color) => {
                onUpdate({
                  [configName]: color,
                });
              })}
              color={config[configName]}
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
