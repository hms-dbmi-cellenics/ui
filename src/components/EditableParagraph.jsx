import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'antd';
import {
  EditOutlined,
} from '@ant-design/icons';

const EditableParagraph = (props) => {
  const { onUpdate, value } = props;

  const paragraphEditor = useRef();

  const [text, setText] = useState(value);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isEditing) {
      paragraphEditor.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setText(value);
  }, [value]);

  const handleUpdate = (e) => {
    const content = e.target.textContent;

    setText(content);
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
      suppressContentEditableWarning
    >
      {text}
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
      { text.length ? renderEllipsisLink() : <></>}
    </>
  );

  const renderContent = () => {
    if (isExpanded) {
      return (
        <p>
          { text }
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
          { text }
        </div>
        { renderControls() }
      </div>
    );
  };

  if (isEditing) return renderEditor();
  return renderContent();
};

EditableParagraph.propTypes = {
  value: PropTypes.string.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default EditableParagraph;
