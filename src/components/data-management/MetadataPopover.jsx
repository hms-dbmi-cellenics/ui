/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import PropTypes from 'prop-types';
import { Popover } from 'antd';
import EditableField from '../EditableField';
import { metadataNameToKey } from '../../utils/metadataUtils';

const MetadataPopover = (props) => {
  const {
    existingMetadata,
    popoverPosition,
    onCreate,
    onCancel,
    message,
    children,
    ...restOfProps
  } = props;

  const getContent = () => (
    <EditableField
      onAfterSubmit={(value) => {
        onCreate(value);
      }}
      onAfterCancel={() => {
        onCancel();
      }}
      deleteEnabled={false}
      value={`Track ${existingMetadata.filter((key) => key.match('Track-')).length + 1}`}
      defaultEditing
      validationFunc={
        (value) => value.length > 0
          && !existingMetadata.map((metadataKey) => metadataKey.toLowerCase())
            .includes(metadataNameToKey(value.toLowerCase()))
      }
    />
  );

  const content = getContent();

  let style = {};
  if (popoverPosition) {
    style = { position: 'absolute', left: popoverPosition.current.x + 20, top: popoverPosition.current.y + 20 };
  }

  return (
    <div style={style}>
      <Popover
        title={message}
        content={content}
        {...restOfProps}
        autoAdjustOverflow
      >
        {children}
      </Popover>
    </div>
  );
};

MetadataPopover.defaultProps = {
  popoverPosition: null,
  message: 'Add cell set',
  children: null,
  existingMetadata: [],
};

MetadataPopover.propTypes = {
  onCreate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  popoverPosition: PropTypes.object,
  children: PropTypes.object,
  message: PropTypes.string,
  existingMetadata: PropTypes.arrayOf(PropTypes.string),
};

export default MetadataPopover;
