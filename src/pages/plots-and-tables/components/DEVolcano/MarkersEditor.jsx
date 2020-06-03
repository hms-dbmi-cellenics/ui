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

const MarkersEditor = (props) => {
  const { onUpdate, config } = props;

  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const colorPickerOptions = [
    {
      config: 'significantDownregulatedColor',
      name: 'Significantly downregulated genes',
    },
    {
      config: 'significantUpregulatedColor',
      name: 'Significantly upregulated genes',
    },
    {
      config: 'notSignificantDownregulatedColor',
      name: 'Insignificantly downregulated genes',
    },
    {
      config: 'notSignificantUpregulatedColor',
      name: 'Insignificantly upregulated genes',
    },
    {
      config: 'significantChangeDirectionUnknownColor',
      name: 'Significant genes, undetermined direction',
    },
    {
      config: 'noDifferenceColor',
      name: 'Genes with no measured difference',
    },
  ];

  return (
    <>
      <Form
        size='small'
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
      >
        <div>Markers</div>
        <Form.Item
          label='Colors'
        >
          <Select
            value='Browse...'
            style={{ width: 350 }}
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

export default MarkersEditor;
