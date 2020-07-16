import React, { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Space, Select,
} from 'antd';

import ColorPicker from '../../../components/ColorPicker';

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

ColorPickerOption.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};

const ColorBrowser = (props) => {
  const { onUpdate, config, colorPickerOptions } = props;
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  return (
    <Select
      value='Browse ...'

      style={{ width: 300 }}
      onChange={(e) => console.log('I changed: ', e)}
      open={colorPickerOpen}
      onFocus={() => setColorPickerOpen(true)}
      onBlur={() => setColorPickerOpen(false)}
    >
      {
        colorPickerOptions.map(({ config: configName, name: text }) => (
          <Option value={configName} key={configName.concat('-key')}>
            <ColorPickerOption
              text={text}
              config={config}
              onUpdate={onUpdate}
              configType={configName}
            />
          </Option>
        ))
      }

    </Select>
  );
};

ColorBrowser.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  colorPickerOptions: PropTypes.arrayOf(PropTypes.object).isRequired,
  config: PropTypes.object.isRequired,
};

export default ColorBrowser;
