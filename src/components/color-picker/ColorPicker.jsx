import React from 'react';
import PropTypes from 'prop-types';
import { Popover, Button } from 'antd';
import { CompactPicker } from 'react-color';
import styled from 'styled-components';

const Swatch = styled.div`
  width: 16px;
  height: 16px;
  background: ${(props) => props.color};
  float: left;
  text-shadow: 2px 2px;
`;

class ColorPicker extends React.Component {
  constructor(props) {
    super(props);

    const { color } = props;

    this.state = {
      colorPicked: color,
    };

    this.handleColorChange = (newColor) => {
      const { hex } = newColor;
      this.setState({ colorPicked: hex });

      const { onColorChange } = this.props;
      onColorChange(hex);
    };

    this.picker = <CompactPicker color={props.color} onChange={this.handleColorChange} />;
  }

  render() {
    const { colorPicked } = this.state;
    return (
      <Popover content={this.picker} placement="bottom" trigger="click">
        <Button type="dashed" size="small">
          <Swatch color={colorPicked} />
        </Button>
      </Popover>
    );
  }
}

ColorPicker.defaultProps = {
  onColorChange: () => null,
};

ColorPicker.propTypes = {
  color: PropTypes.string.isRequired,
  onColorChange: PropTypes.func,
};


export default ColorPicker;
