/* eslint-disable max-classes-per-file */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Popover, Button, Input, Space, Tooltip,
} from 'antd';

import {
  EditOutlined, DeleteOutlined,
} from '@ant-design/icons';


const EditablePopoverContent = (props) => {
  const { defaultText } = props;
  const [text, setText] = useState(defaultText);

  const onEditCallback = () => {
    props.onDone(text);
  };

  const onCancelCallback = () => {
    props.onDone(text);
  };

  return (
    <Space>
      <Input
        autoFocus
        size='small'
        value={text}
        onChange={(e) => setText(e.target.value)}
        onPressEnter={onEditCallback}
      />
      <Tooltip placement='bottom' title='Change color' mouseEnterDelay={0} mouseLeaveDelay={0}>
        <Button type='primary' size='small' onClick={onEditCallback}>Edit</Button>
      </Tooltip>
      <Tooltip placement='bottom' title='Change color' mouseEnterDelay={0} mouseLeaveDelay={0}>
        <Button size='small' onClick={onCancelCallback}>Cancel</Button>
      </Tooltip>
    </Space>
  );
};

EditablePopoverContent.propTypes = {
  defaultText: PropTypes.string.isRequired,
  onDone: PropTypes.func.isRequired,
};

const EditableField = (props) => {
  const { children, defaultText, showDelete } = props;
  const [showPopover, setShowPopover] = useState(false);

  const renderPopover = () => {
    setShowPopover(true);
  };

  const closePopover = (newText) => {
    if (newText !== defaultText) {
      props.onEdit(newText);
    }

    setShowPopover(false);
  };

  const deleteEditableField = () => {
    props.onDelete();
  };

  return (
    <Space>
      {children}
      <Popover
        visible={showPopover}
        content={(
          <EditablePopoverContent
            defaultText={defaultText}
            onDone={closePopover}
          />
        )}
        placement='bottom'
        trigger='click'
      >
        <Tooltip placement='bottom' title='Edit' mouseLeaveDelay={0}>
          <Button size='small' shape='circle' icon={<EditOutlined />} onClick={renderPopover} />
        </Tooltip>
        {showDelete
          ? (
            <Tooltip placement='bottom' title='Delete' mouseLeaveDelay={0}>
              <Button size='small' shape='circle' icon={<DeleteOutlined />} onClick={deleteEditableField} />
            </Tooltip>
          ) : <></>}
      </Popover>
    </Space>
  );
};

EditableField.defaultProps = {
  onEdit: () => null,
  onDelete: () => null,
  showDelete: true,
  defaultText: '',
};

EditableField.propTypes = {
  children: PropTypes.node.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  defaultText: PropTypes.string,
  showDelete: PropTypes.bool,
};

export default EditableField;
