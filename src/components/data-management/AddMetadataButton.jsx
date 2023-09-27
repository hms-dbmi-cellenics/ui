import React, { useState } from 'react';
import {
  Menu, Dropdown, Button,
} from 'antd';
import PropTypes from 'prop-types';
import axios from 'axios';

import { useSelector, useDispatch } from 'react-redux';

import uploadMetadataFile from 'redux/actions/experiments/uploadMetadataFile';
import { sampleTech } from 'utils/constants';
import createCellLevelMetadata from 'redux/actions/experiments/createCellLevelMetadata';
import { putPartInS3 } from 'utils/upload/processMultipartUpload';
import MetadataUploadModal from './MetadataUploadModal';
import CellLevelUploadModal from './CellLevelUploadModal';

const AddMetadataButton = ({ samplesTableRef }) => {
  const dispatch = useDispatch();
  const { activeExperimentId } = useSelector((state) => state.experiments.meta);
  const activeExperiment = useSelector((state) => state.experiments[activeExperimentId]);
  const isSubsetted = activeExperiment?.isSubsetted;
  const samples = useSelector((state) => state.samples);
  const selectedTech = samples[activeExperiment?.sampleIds[0]]?.type;

  const [uploadModalVisible, setMetadataUploadModalVisible] = useState(false);
  const [cellLevelUploadVisible, setCellLevelUploadVisible] = useState(false);

  const onUploadMetadataTrack = (file) => {
    dispatch(uploadMetadataFile(activeExperimentId, file));
    setMetadataUploadModalVisible(false);
  };

  const onUploadCellLevelMetadata = async (file) => {
    const body = {
      name: file.name,
    };

    const signedUploadURL = await dispatch(createCellLevelMetadata(activeExperimentId, body));
    await putPartInS3(file, signedUploadURL, (progressEvent) => console.log('uploaded ', progressEvent.loaded, ' of total ', progressEvent.total));
    setCellLevelUploadVisible(false);
  };

  return (
    <>
      <Dropdown
        overlay={() => (
          <Menu>
            <Menu.SubMenu title='Sample level' key='sample-level'>
              <Menu.Item
                key='add-metadata-column'
                data-testid='create-track-option'
                onClick={() => samplesTableRef.current.createMetadataColumn()}
              >
                Create track
              </Menu.Item>
              <Menu.Item
                key='upload-metadata-file'
                onClick={() => {
                  setMetadataUploadModalVisible(true);
                }}
              >
                Upload file
              </Menu.Item>
            </Menu.SubMenu>
            <Menu.Item
              key='cell-level'
              onClick={() => setCellLevelUploadVisible(true)}
            >
              Cell level
            </Menu.Item>
          </Menu>
        )}
        trigger={['click']}
        placement='bottomRight'
        disabled={activeExperiment.sampleIds?.length === 0 || isSubsetted || selectedTech === sampleTech.SEURAT}
      >
        <Button>
          Add metadata
        </Button>
      </Dropdown>
      {uploadModalVisible && (
        <MetadataUploadModal
          onUpload={onUploadMetadataTrack}
          onCancel={() => setMetadataUploadModalVisible(false)}
        />
      )}
      {cellLevelUploadVisible && (
        <CellLevelUploadModal
          onUpload={onUploadCellLevelMetadata}
          onCancel={() => setCellLevelUploadVisible(false)}
        />
      )}
    </>
  );
};

AddMetadataButton.propTypes = {
  samplesTableRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
};

export default AddMetadataButton;
