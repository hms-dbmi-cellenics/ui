/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import PropTypes from 'prop-types';
import { Popover } from 'antd';
import { metadataKeyToName, metadataNameToKey } from 'utils/data-management/metadataUtils';
import validateInputs, { rules } from 'utils/validateInputs';
import EditableField from '../EditableField';

const validationChecks = [
  rules.MIN_1_CHAR,
  rules.ALPHANUM_SPACE,
  rules.UNIQUE_NAME_CASE_INSENSITIVE,
  rules.START_WITH_ALPHABET,
];

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

  const validationParams = {
    existingNames: existingMetadata.map(
      (metadataKey) => metadataKeyToName(metadataKey).toLowerCase(),
    ),
  };

  const getContent = () => (
    <EditableField
      onAfterSubmit={(value) => {
        onCreate(value);
      }}
      onAfterCancel={() => {
        onCancel();
      }}
      deleteEnabled={false}
      value={`Track ${existingMetadata.filter((key) => key.match('Track_')).length + 1}`}
      defaultEditing
      validationFunc={(name) => validateInputs(
        metadataKeyToName(metadataNameToKey(name)), validationChecks, validationParams,
      ).isValid}
      formatter={(value) => value.trim()}
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
