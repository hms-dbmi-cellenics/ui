import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Popover, Button, Tooltip } from 'antd';
import { SketchPicker } from 'react-color';

const ColorPicker = (props) => {
  const { color, zIndex, onColorChange } = props;

  const [colorPicked, setColorPicked] = useState(color);
  const [visible, setVisible] = useState(false);

  const onTemporaryColorChange = (newColor) => {
    const { hex } = newColor;
    setColorPicked(hex);
  };

  const onFinalColorChange = (newColor) => {
    const { hex } = newColor;
    setColorPicked(hex);
    onColorChange(hex);
  };

  const pickerComponent = () => (
    <SketchPicker
      color={colorPicked}
      onChange={onTemporaryColorChange}
      onChangeComplete={onFinalColorChange}
    />
  );

  return (
    <div style={{ zIndex }}>
      <Popover
        content={pickerComponent()}
        placement='bottom'
        trigger='click'
        open={visible}
        onOpenChange={(newVisible) => setVisible(newVisible)}
        destroyTooltipOnHide
        zIndex={zIndex}
      >
        <Button
          size='small'
          shape='circle'
          style={{ backgroundColor: colorPicked }}
          onClick={(e) => {
            e.stopPropagation();
            setVisible(true);
          }}
        >
          <Tooltip placement='bottom' title='Change color' mouseEnterDelay={0} mouseLeaveDelay={0}>
            <span>&nbsp;</span>
          </Tooltip>

        </Button>
      </Popover>
    </div>
  );
};

ColorPicker.defaultProps = {
  onColorChange: () => null,
  zIndex: 5,
};

ColorPicker.propTypes = {
  color: PropTypes.string.isRequired,
  onColorChange: PropTypes.func,
  zIndex: PropTypes.number,
};

export default ColorPicker;
