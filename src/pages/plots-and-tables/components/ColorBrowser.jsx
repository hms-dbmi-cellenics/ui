import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Select } from 'antd';
import ColorPickerOption from './ColorPickerOption';

const { Option } = Select;

const ColorBrowser = (props) => {
  const { onUpdate, config, colorPickerOptions } = props;
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  return (
    <Select
      value='Browse ...'
      style={{ width: 300 }}
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
