import React from 'react';
import { Space, Input } from 'antd';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import validateInputs, { rules } from '../../utils/validateInputs';
import EditableField from '../EditableField';
import MetadataEditor from './MetadataEditor';
import { DEFAULT_NA } from '../../redux/reducers/projects/initialState';
import { metadataNameToKey } from '../../utils/data-management/metadataUtils';

import {
  updateMetadataTrack,
} from '../../redux/actions/projects';

const MetadataColumnTitle = (props) => {
  const {
    name, sampleNames, activeProjectUuid, deleteMetadataColumn, setCells,
  } = props;
  const key = metadataNameToKey(name);

  const validationParams = {
    existingNames: sampleNames,
  };

  console.log('MA KEY ', key);

  return (
    <MetadataTitle
      name={name}
      validateInput={
        (newName, metadataNameValidation) => validateInputs(
          newName, metadataNameValidation, validationParams,
        ).isValid
      }
      setCells={setCells}
      deleteMetadataColumn={deleteMetadataColumn}
      key={key}
      activeProjectUuid={activeProjectUuid}
    />
  );
};

MetadataColumnTitle.propTypes = {
  name: PropTypes.string.isRequired,
  sampleNames: PropTypes.instanceOf(Set).isRequired,
  setCells: PropTypes.func.isRequired,
  deleteMetadataColumn: PropTypes.func.isRequired,
  activeProjectUuid: PropTypes.string.isRequired,
};

const MetadataTitle = (props) => {
  const dispatch = useDispatch();
  const {
    name, validateInput, setCells, deleteMetadataColumn, key, activeProjectUuid,
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
          (newName) => validateInput(newName, metadataNameValidation)
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
MetadataTitle.propTypes = {
  name: PropTypes.string.isRequired,
  validateInput: PropTypes.func.isRequired,
  setCells: PropTypes.func.isRequired,
  deleteMetadataColumn: PropTypes.func.isRequired,
  key: PropTypes.string.isRequired,
  activeProjectUuid: PropTypes.string.isRequired,
};
export default MetadataColumnTitle;
