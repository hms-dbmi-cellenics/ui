import React from 'react';
import PropTypes from 'prop-types';
import { Space } from 'antd';
import ColorPicker from '../../../../../components/ColorPicker';

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
  configType: PropTypes.object.isRequired,
  text: PropTypes.string.isRequired,
};

export default ColorPickerOption;
