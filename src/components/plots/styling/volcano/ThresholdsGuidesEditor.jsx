import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Form, InputNumber, Checkbox, Space, Select, Typography,
} from 'antd';
import _ from 'lodash';
import ColorPicker from 'components/ColorPicker';

const { Option } = Select;
const { Text } = Typography;

const ColorPickerOption = (props) => {
  // See the z index here:
  // https://github.com/ant-design/ant-design/blob/master/components/style/themes/default.less#L332
  // This ensures that the color selector is on top of any dropdown it may be embedded into.
  const COLOR_PICKER_Z_INDEX = 1050;

  const {
    onUpdate, configType, text, config,
  } = props;

  return (
    <Space>
      <span>
        {text}
      </span>
      <ColorPicker
        onColorChange={((color) => {
          onUpdate({
            [configType]: color,
          });
        })}
        color={config[configType]}
        zIndex={COLOR_PICKER_Z_INDEX}
      />
    </Space>
  );
};

ColorPickerOption.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
  configType: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
};

const ThresholdsGuidesEditor = (props) => {
  const { onUpdate, config } = props;

  const [colorPickerOpen, setColorPickerOpen] = useState(false);

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
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <p><strong>Significance Thresholds</strong></p>
        <Form.Item
          label={(
            <span>
              Adjusted p-value
            </span>
          )}
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
          label={(
            <span>
              Fold change
              {' '}
              <em>(log)</em>
            </span>
          )}
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
          label='Width'
        >
          <InputNumber
            min={1}
            value={config.thresholdGuideWidth}
            type='number'
            onChange={(val) => debouncedUpdate({ thresholdGuideWidth: val })}
          />
        </Form.Item>
        <Form.Item
          label='Colors'
        >
          <Select
            value='Browse...'
            style={{ width: 200 }}
            onChange={() => false}
            open={colorPickerOpen}
            onFocus={() => setColorPickerOpen(true)}
            onBlur={() => setColorPickerOpen(false)}
          >
            {colorPickerOptions.map(({ config: configName, name: text }) => (
              <Option value={configName}>
                <ColorPickerOption
                  text={text}
                  config={config}
                  onUpdate={onUpdate}
                  configType={configName}
                />
              </Option>
            ))}
          </Select>
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
