import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Select } from 'antd';
import ColorPickerOption from './ColorPickerOption';

const { Option } = Select;

const ColorBrowser = (props) => {
  const { colorPickerOptions, width } = props;
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  return (
    <Select
      value='Browse ...'
      style={{ width }}
      open={colorPickerOpen}
      onFocus={() => setColorPickerOpen(true)}
      onBlur={() => setColorPickerOpen(false)}
    >
      {
        colorPickerOptions.map(({
          key, text, colourHandler, colourValue,
        }) => (
          <Option value={key} key={key}>
            <ColorPickerOption
              text={text}
              value={colourValue}
              onUpdate={colourHandler}
            />
          </Option>
        ))
      }

    </Select>
  );
};

const ColorPickerItem = PropTypes.shape({
  key: PropTypes.string,
  text: PropTypes.string,
  colourHandler: PropTypes.func,
  colourValue: PropTypes.func,
});

ColorBrowser.propTypes = {
  colorPickerOptions: PropTypes.arrayOf(ColorPickerItem).isRequired,
  width: PropTypes.number,
};

ColorBrowser.defaultProps = {
  width: 200,
};

export default ColorBrowser;
