import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'antd';
import {
  EditOutlined,
} from '@ant-design/icons';

const EditablePagrapraph = (props) => {
  const { onUpdate, value } = props;

  const paragraphEditor = useRef();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isEditing) {
      paragraphEditor.current.focus();
    }
  }, [isEditing]);

  const renderEditButton = () => <Button style={{ padding: 0 }} type='link' icon={<EditOutlined />} onClick={() => setIsEditing(true)} />;

  const renderEllipsisLink = (isCurrentlyExpanded) => (
    <Button
      type='link'
      style={{ padding: 0 }}
      onClick={() => setIsExpanded(!isCurrentlyExpanded)}
    >
      { isCurrentlyExpanded ? 'less' : 'more' }
    </Button>
  );

  const renderEditor = () => (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <p
      contentEditable
      ref={paragraphEditor}
      style={{
        backgroundColor: 'white',
      }}
      onBlur={(e) => {
        onUpdate(e.target.textContent);
        setIsEditing(false);
      }}
      onKeyDown={(e) => {
        if (e.keyCode === 13) {
          onUpdate(e.target.textContent);
          setIsEditing(false);
        }
      }}
    >
      {value}
    </p>
  );

  const renderContent = (isCurrentlyExpanded) => {
    if (isCurrentlyExpanded) {
      return (
        <p>
          { value }
          { renderEditButton() }
          { renderEllipsisLink(isCurrentlyExpanded) }
        </p>
      );
    }

    return (
      <div style={{ display: 'flex' }}>
        <p
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          { value }
        </p>
        { renderEditButton() }
        { renderEllipsisLink(isCurrentlyExpanded) }
      </div>
    );
  };

  if (isEditing) return renderEditor();
  return renderContent(isExpanded);
};

EditablePagrapraph.propTypes = {
  value: PropTypes.string.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default EditablePagrapraph;
