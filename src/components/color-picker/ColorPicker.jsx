import React from 'react';
import PropTypes from 'prop-types';
import { Popover, Button, Tooltip } from 'antd';
import { CompactPicker } from 'react-color';

class ColorPicker extends React.Component {
  constructor(props) {
    super(props);

    const { color } = props;

    this.state = {
      colorPicked: color,
      visible: false,
    };

    this.handleColorChange = (newColor) => {
      const { hex } = newColor;
      this.setState({ colorPicked: hex, visible: false });

      const { onColorChange } = this.props;
      onColorChange(hex);
    };

    this.picker = <CompactPicker color={props.color} onChangeComplete={this.handleColorChange} />;
  }

  render() {
    const { colorPicked, visible } = this.state;
    const { zIndex } = this.props;
    return (
      <div style={{ zIndex: 1 }}>
        <Popover content={this.picker} placement='bottom' trigger='click' visible={visible} zIndex={zIndex}>
          <Button
            size='small'
            shape='circle'
            style={{ backgroundColor: colorPicked }}
            onClick={(() => this.setState({ visible: true }))}
          >
            <Tooltip placement='bottom' title='Change color' mouseEnterDelay={0} mouseLeaveDelay={0}>
              <span>&nbsp;</span>
            </Tooltip>

          </Button>
        </Popover>
      </div>
    );
  }
}

ColorPicker.defaultProps = {
  onColorChange: () => null,
  zIndex: null,
};

ColorPicker.propTypes = {
  color: PropTypes.string.isRequired,
  onColorChange: PropTypes.func,
  zIndex: PropTypes.number,
};


export default ColorPicker;
