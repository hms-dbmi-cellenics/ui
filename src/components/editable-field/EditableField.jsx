import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Input, Space, Tooltip,
} from 'antd';

import {
  EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined,
} from '@ant-design/icons';


const EditableField = (props) => {
  const {
    value, showDelete, showEdit, onEdit, titleRenderFunction,
  } = props;
  const [editing, setEditing] = useState(false);
  const [editedValue, setEditedValue] = useState(value);

  const deleteEditableField = () => {
    props.onDelete();
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter') {
      onSubmit();
    }

    if (event.key === 'Escape') {
      onCancel();
    }
  };

  const onChange = (e) => {
    const { value: newValue } = e.target;

    setEditedValue(newValue);
  };

  const onSubmit = () => {
    onEdit(editedValue);
    toggleEditing();
  };

  const onCancel = () => {
    setEditedValue(value);
    toggleEditing();
  };

  const toggleEditing = () => {
    setEditing(!editing);
  };

  const renderEditState = () => {
    if (editing) {
      return (
        <>
          <Input
            autoFocus
            onChange={onChange}
            size='small'
            defaultValue={editedValue}
            onKeyDown={onKeyDown}
          />

          <Tooltip placement='bottom' title='Save' mouseLeaveDelay={0}>
            <Button size='small' shape='circle' icon={<CheckOutlined />} onClick={onSubmit} />
          </Tooltip>

          <Tooltip placement='bottom' title='Cancel' mouseLeaveDelay={0}>
            <Button size='small' shape='circle' icon={<CloseOutlined />} onClick={onCancel} />
          </Tooltip>

        </>
      );
    }

    return (
      <>
        {titleRenderFunction(editedValue)}
        {
          showEdit
            ? (
              <Tooltip placement='bottom' title='Edit' mouseLeaveDelay={0}>
                <Button size='small' shape='circle' icon={<EditOutlined />} onClick={toggleEditing} />
              </Tooltip>
            ) : <></>
        }
      </>
    );
  };

  return (
    <Space>
      {renderEditState()}
      {
        showDelete
          ? (
            <Tooltip placement='bottom' title='Delete' mouseLeaveDelay={0}>
              <Button size='small' shape='circle' icon={<DeleteOutlined />} onClick={deleteEditableField} />
            </Tooltip>
          ) : <></>
      }
    </Space>
  );
};

EditableField.defaultProps = {
  onEdit: () => null,
  onDelete: () => null,
  titleRenderFunction: (title) => <span>{title}</span>,
  showDelete: true,
  showEdit: true,
};

EditableField.propTypes = {
  value: PropTypes.string.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  showDelete: PropTypes.bool,
  showEdit: PropTypes.bool,
  titleRenderFunction: PropTypes.func,
};

export default EditableField;
