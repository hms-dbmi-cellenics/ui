import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {
  CloseOutlined,
} from '@ant-design/icons';


class CloseWindow extends Component {
  closeTool(key) {
    const { openedTools } = this.state;
    this.setState({ openedTools: openedTools.filter((obj) => obj.key !== key) });
  }

  render() {
    const { params, action } = this.props;
    return (
      <CloseOutlined
        // style={{ float: 'right' }}
        onClick={(event) => {
          action(params);
          event.stopPropagation();
        }}
      />
    );
  }
}

CloseWindow.defaultProps = {};

CloseWindow.propTypes = {
  action: PropTypes.func.isRequired,
  params: PropTypes.string.isRequired,

};

export default CloseWindow;
