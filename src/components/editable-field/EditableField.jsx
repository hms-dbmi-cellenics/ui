/* eslint-disable max-classes-per-file */
import React from 'react';
import PropTypes from 'prop-types';
import {
  Popover, Button, Input, Space,
} from 'antd';

import {
  EditOutlined,
} from '@ant-design/icons';

class EditablePopoverContent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentText: props.defaultText,
    };

    this.onEditCallback = this.onEditCallback.bind(this);
    this.onCancelCallback = this.onCancelCallback.bind(this);
  }

  onEditCallback() {
    const { onDone } = this.props;
    const { currentText } = this.state;
    onDone(currentText);
  }

  onCancelCallback() {
    const { onDone, defaultText } = this.props;

    onDone(defaultText);
  }

  render() {
    const { currentText } = this.state;
    return (
      <Space>
        <Input
          autoFocus
          size="small"
          value={currentText}
          onChange={(e) => { this.setState({ currentText: e.target.value }); }}
          onPressEnter={this.onEditCallback}
        />
        <Button type="primary" size="small" onClick={this.onEditCallback}>Edit</Button>
        <Button size="small" onClick={this.onCancelCallback}>Cancel</Button>
      </Space>
    );
  }
}

EditablePopoverContent.propTypes = {
  defaultText: PropTypes.string.isRequired,
  onDone: PropTypes.func.isRequired,
};

class EditableField extends React.Component {
  constructor(props) {
    super(props);

    this.onPopoverVisibilityChange = this.onPopoverVisibilityChange.bind(this);
    this.closePopover = this.closePopover.bind(this);

    this.state = {
      visible: false,
    };
  }

  onPopoverVisibilityChange(v) {
    this.setState({ visible: v });
  }

  closePopover(newText) {
    const { onEdit, defaultText } = this.props;

    if (newText !== defaultText) {
      onEdit(newText);
    }

    this.setState({ visible: false });
  }

  render() {
    const { children, defaultText } = this.props;
    const { visible } = this.state;

    return (
      <>
        {children}
        <Popover
          visible={visible}
          onVisibleChange={this.onPopoverVisibilityChange}
          content={(
            <EditablePopoverContent
              defaultText={defaultText}
              onDone={this.closePopover}
            />
          )}
          placement="bottom"
          trigger="click"
        >
          <Button type="link" size="small">
            <EditOutlined />
          </Button>
        </Popover>
      </>
    );
  }
}

EditableField.defaultProps = {
  onEdit: () => null,
  defaultText: '',
};

EditableField.propTypes = {
  children: PropTypes.node.isRequired,
  onEdit: PropTypes.func,
  defaultText: PropTypes.string,
};

export default EditableField;
