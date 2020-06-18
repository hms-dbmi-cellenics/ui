import React, { useState } from 'react';

import {
  Form, InputNumber, Checkbox, Space, Select,
} from 'antd';

import ColorPicker from '../../../../components/color-picker/ColorPicker';

const { Option } = Select;

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

  return (
    <>
      <Form
        size='small'
        labelCol={{ span: 12 }}
        wrapperCol={{ span: 12 }}
      >
        <div>Significance thresholds</div>
        <Form.Item
          label={(
            <span>
              p-value
              {' '}
              <em>(linear)</em>
            </span>
          )}
        >
          <Space>
            <InputNumber
              min={0}
              defaultValue={0.05}
              onPressEnter={(e) => {
                const value = parseFloat(e.target.value);
                onUpdate({ pvalueThreshold: value  });

              }}
            />
            <Checkbox
              onChange={(e) => {
                const { checked } = e.target;

                if (checked) {
                  onUpdate({ showpvalueThresholdGuides: true });
                } else {
                  onUpdate({ showpvalueThresholdGuides: false });
                }
              }}
            >
              Guides
            </Checkbox>
          </Space>
        </Form.Item>

        <Form.Item
          label={(
            <span>
              Fold change
              {' '}
              <em>(log2)</em>
            </span>
          )}
        >
          <Space>
            <InputNumber
              min={0}
              defaultValue={1}
              onPressEnter={(e) => {
                const value = parseInt(e.target.value, 10);
                onUpdate({ logFoldChangeThreshold: value });
              }}
            />
            <Checkbox
              onChange={(e) => {
                const { checked } = e.target;

                if (checked) {
                  onUpdate({ showLogFoldChangeThresholdGuides: true });
                } else {
                  onUpdate({ showLogFoldChangeThresholdGuides: false });
                }
              }}
            >
              Guides
            </Checkbox>
          </Space>
        </Form.Item>

        <div>Threshold guides</div>
        <Form.Item
          label='Width'
        >
          <InputNumber
            min={0}
            defaultValue={1}
            onPressEnter={(e) => {
              const value = parseFloat(e.target.value);
              onUpdate({ thresholdGuideWidth: value });
            }}
          />
        </Form.Item>
        <Form.Item
          label='Colors'
        >
          <Select
            value='Browse...'
            style={{ width: 200 }}
            onChange={(e) => false}
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

export default ThresholdsGuidesEditor;
