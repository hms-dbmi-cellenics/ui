import React from 'react';
import { Space, Input } from 'antd';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import MetadataPopover from './MetadataPopover';
import { rules } from '../../utils/validateInputs';
import EditableField from '../EditableField';
import MetadataEditor from './MetadataEditor';
import { DEFAULT_NA } from '../../redux/reducers/projects/initialState';

import {
  createMetadataTrack,
  updateMetadataTrack,
} from '../../redux/actions/projects';

const TemporalMetadataColumn = (props) => {
  const dispatch = useDispatch();
  const {
    existingMetadata, updateTableColumns, activeProjectUuid,
    createInitializedMetadataColumn, setIsAddingMetadata, deleteMetadataColumn,
  } = props;

  return (
    <MetadataPopover
      existingMetadata={existingMetadata}
      onCreate={(name) => {
        const newMetadataColumn = createInitializedMetadataColumn(name);
        updateTableColumns(newMetadataColumn);
        dispatch(createMetadataTrack(name, activeProjectUuid));

        setIsAddingMetadata(false);
      }}
      onCancel={() => {
        deleteMetadataColumn();
        setIsAddingMetadata(false);
      }}
      message='Provide new metadata track name'
      visible
    >
      <Space>
        New Metadata Track
      </Space>
    </MetadataPopover>
  );
};

TemporalMetadataColumn.propTypes = {
  existingMetadata: PropTypes.array.isRequired,
  setIsAddingMetadata: PropTypes.func.isRequired,
  activeProjectUuid: PropTypes.string.isRequired,
  updateTableColumns: PropTypes.func.isRequired,
  deleteMetadataColumn: PropTypes.func.isRequired,
  createInitializedMetadataColumn: PropTypes.func.isRequired,
};

const InitializedMetadataColumn = (props) => {
  const dispatch = useDispatch();
  const {
    name, validateInputs, setCells, deleteMetadataColumn, key, activeProjectUuid,
  } = props;
  const metadataNameValidation = [
    rules.MIN_1_CHAR,
    rules.ALPHANUM_SPACE,
    rules.START_WITH_ALPHABET,
    rules.UNIQUE_NAME_CASE_INSENSITIVE,
  ];
  return (
    <Space>
      <EditableField
        deleteEnabled
        onDelete={(e, currentName) => deleteMetadataColumn(currentName)}
        onAfterSubmit={(newName) => dispatch(
          updateMetadataTrack(name, newName, activeProjectUuid),
        )}
        value={name}
        validationFunc={
          (newName) => validateInputs(newName, metadataNameValidation)
        }
      />
      <MetadataEditor
        onReplaceEmpty={(value) => setCells(value, key, 'REPLACE_EMPTY')}
        onReplaceAll={(value) => setCells(value, key, 'REPLACE_ALL')}
        onClearAll={() => setCells(DEFAULT_NA, key, 'CLEAR_ALL')}
        massEdit
      >
        <Input />
      </MetadataEditor>
    </Space>
  );
};
InitializedMetadataColumn.propTypes = {
  name: PropTypes.string.isRequired,
  validateInputs: PropTypes.func.isRequired,
  setCells: PropTypes.func.isRequired,
  deleteMetadataColumn: PropTypes.func.isRequired,
  key: PropTypes.string.isRequired,
  activeProjectUuid: PropTypes.string.isRequired,
};
export { TemporalMetadataColumn, InitializedMetadataColumn };
