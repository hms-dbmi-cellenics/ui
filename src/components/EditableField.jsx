import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Input, Space, Tooltip, Typography,
} from 'antd';

import {
  EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

const EditableField = (props) => {
  const {
    value,
    deleteEnabled,
    showEdit,
    onAfterSubmit,
    onAfterCancel,
    renderBold,
    defaultEditing,
    validationFunc,
    errorText,
  } = props;

  const [editing, setEditing] = useState(defaultEditing);
  const [editedValue, setEditedValue] = useState(value);
  const [isValid, setIsValid] = useState(true);
  const [errorCode, setErrorCode] = useState(null);

  useEffect(() => {
    setEditedValue(value);
  }, [value]);

  const deleteEditableField = (e) => {
    props.onDelete(e);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSubmit(e);
    }

    if (e.key === 'Escape') {
      onCancel(e);
    }
  };

  const onChange = (e) => {
    const { value: newValue } = e.target;

    // Returns true on valid, error code on false
    const validation = value === newValue || validationFunc(newValue);
    if (validation !== true) {
      setErrorCode(validation);
      setIsValid(false);
    } else {
      setIsValid(true);
    }

    setEditedValue(newValue);
  };

  const onSubmit = (e) => {
    e.stopPropagation();
    if (!isValid) return null;
    onAfterSubmit(editedValue);
    toggleEditing(e);
  };

  const onCancel = (e) => {
    e.stopPropagation();
    if (!isValid) setIsValid(true);
    setEditedValue(value);
    toggleEditing(e);
    onAfterCancel();
  };

  const toggleEditing = (e) => {
    e.stopPropagation();
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
        {renderBold ? <strong>{editedValue}</strong> : <span>{editedValue}</span>}
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
    <>
      <Space direction='vertical'>
        <Space>
          {renderEditState()}
          {
            deleteEnabled
              ? (
                <Tooltip placement='bottom' title='Delete' mouseLeaveDelay={0}>
                  <Button size='small' shape='circle' icon={<DeleteOutlined />} onClick={deleteEditableField} />
                </Tooltip>
              ) : <></>
          }
        </Space>
        {!isValid ? (
          <Text type='danger'>
            {typeof errorText === 'string'
              || React.isValidElement(errorText) ? errorText
              : errorText[errorCode]}
          </Text>
        ) : <></>}
      </Space>
    </>
  );
};

EditableField.defaultProps = {
  onAfterSubmit: () => null,
  onAfterCancel: () => null,
  onDelete: () => null,
  validationFunc: null,
  errorText: {},
  renderBold: false,
  value: null,
  showEdit: true,
  deleteEnabled: true,
  defaultEditing: false,
};

EditableField.propTypes = {
  value: PropTypes.string,
  onAfterSubmit: PropTypes.func,
  onAfterCancel: PropTypes.func,
  onDelete: PropTypes.func,
  validationFunc: PropTypes.func,
  errorText: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string,
  ]),
  deleteEnabled: PropTypes.bool,
  showEdit: PropTypes.bool,
  renderBold: PropTypes.bool,
  defaultEditing: PropTypes.bool,
};

export default EditableField;
