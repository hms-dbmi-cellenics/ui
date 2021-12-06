import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'antd';
import {
  EditOutlined,
} from '@ant-design/icons';

const EditablePagrapraph = (props) => {
  const { onUpdate, value: inputValue } = props;

  const paragraphEditor = useRef();

  const [value, setValue] = useState(inputValue);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isEditing) {
      paragraphEditor.current.focus();
    }
  }, [isEditing]);

  const handleUpdate = (e) => {
    const content = e.target.textContent;

    setValue(content);
    onUpdate(content);
    setIsEditing(false);
  };

  const renderEditor = () => (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <p
      contentEditable
      ref={paragraphEditor}
      style={{
        backgroundColor: 'white',
      }}
      onBlur={(e) => handleUpdate(e)}
      onKeyDown={(e) => {
        if (e.keyCode === 13) {
          handleUpdate(e);
        }
      }}
    >
      {value}
    </p>
  );

  const renderEditButton = () => <Button style={{ padding: 0 }} type='link' icon={<EditOutlined />} onClick={() => setIsEditing(true)} />;

  const renderEllipsisLink = () => (
    <Button
      type='link'
      style={{ padding: 0 }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      { isExpanded ? 'less' : 'more' }
    </Button>
  );

  const renderControls = () => (
    <>
      { renderEditButton() }
      { value.length ? renderEllipsisLink() : <></>}
    </>
  );

  const renderContent = () => {
    if (isExpanded) {
      return (
        <p>
          { value }
          { renderControls() }
        </p>
      );
    }

    return (
      <div style={{ display: 'flex' }}>
        <div
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            paddingTop: '0.25em',
          }}
        >
          { value }
        </div>
        { renderControls() }
      </div>
    );
  };

  if (isEditing) return renderEditor();
  return renderContent();
};

EditablePagrapraph.propTypes = {
  value: PropTypes.string.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default EditablePagrapraph;
