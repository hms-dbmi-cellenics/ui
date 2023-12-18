/* eslint-disable no-param-reassign */
import React, { useState } from 'react';
import {
  Dropdown, Button,
} from 'antd';
import PropTypes from 'prop-types';

import { useSelector, useDispatch } from 'react-redux';
import UploadStatus from 'utils/upload/UploadStatus';

import uploadMetadataFile from 'redux/actions/experiments/uploadMetadataFile';
import { sampleTech } from 'utils/constants';
import {
  createCellLevelMetadata,
  updateCellLevelMetadataFileUpload,
} from 'redux/actions/experiments';
import { prepareAndUploadFileToS3 } from 'utils/upload/processUpload';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import loadAndCompressIfNecessary from 'utils/upload/loadAndCompressIfNecessary';
import MetadataUploadModal from './MetadataUploadModal';
import CellLevelUploadModal from './CellLevelUploadModal';

const AddMetadataButton = ({ samplesTableRef }) => {
  const dispatch = useDispatch();
  const { activeExperimentId } = useSelector((state) => state.experiments.meta);
  const activeExperiment = useSelector((state) => state.experiments[activeExperimentId]);
  const isSubsetted = activeExperiment?.isSubsetted;
  const samples = useSelector((state) => state.samples);
  const selectedTech = samples[activeExperiment?.sampleIds[0]]?.type;
  const cellLevelMetadata = useSelector(
    (state) => state.experiments[activeExperimentId]?.cellLevelMetadata,
  ) || false;
  const [trackUploadModalVisible, setTrackUploadModalVisible] = useState(false);
  const [cellLevelUploadVisible, setCellLevelUploadVisible] = useState(false);

  const [cellLevelUploading, setCellLevelUploading] = useState(false);
  const onUploadMetadataTrack = (file) => {
    dispatch(uploadMetadataFile(activeExperimentId, file));
    setTrackUploadModalVisible(false);
  };

  const onUploadCellLevelMetadata = async (file) => {
    setCellLevelUploading(true);
    const getSignedURLsParams = {
      name: file.name,
      size: file.size,
    };
    const onUpdateUploadStatus = (status, percentProgress = 0) => {
      dispatch(updateCellLevelMetadataFileUpload(activeExperimentId, status, percentProgress));
    };
    const uploadUrlParams = await dispatch(
      createCellLevelMetadata(activeExperimentId, getSignedURLsParams),
    );

    if (!file.fileObject) {
      file.fileObject = await loadAndCompressIfNecessary(
        file, () => onUpdateUploadStatus(UploadStatus.COMPRESSING),
      );
    }

    try {
      await prepareAndUploadFileToS3(file, uploadUrlParams, 'cellLevelMeta', new AbortController(), onUpdateUploadStatus);
    } catch (e) {
      pushNotificationMessage('error', 'Something went wrong while uploading your metadata file.');
      console.log(e);
    }
    setCellLevelUploading(false);
    return file;
  };

  return (
    <>
      <Dropdown
        menu={{
          items: [
            {
              key: 'sample-level',
              label: 'Sample level',
              children: [
                {
                  label: 'Create track',
                  key: 'add-metadata-column',
                  'data-testid': 'create-track-option',
                  onClick: () => {
                    samplesTableRef.current.createMetadataColumn();
                  },
                },
                {
                  label: 'Upload file',
                  key: 'upload-metadata-file',
                  onClick: () => {
                    setTrackUploadModalVisible(true);
                  },
                },
              ],
            },
            {
              key: 'cell-level',
              label: 'Cell level',
              disabled: false,
              onClick: () => {
                setCellLevelUploadVisible(true);
              },
            },
          ],
        }}
        trigger={['click']}
        placement='bottomRight'
        disabled={activeExperiment.sampleIds?.length === 0 || isSubsetted || selectedTech === sampleTech.SEURAT}
      >
        <Button>
          Metadata
        </Button>
      </Dropdown>
      {trackUploadModalVisible && (
        <MetadataUploadModal
          onUpload={onUploadMetadataTrack}
          onCancel={() => setTrackUploadModalVisible(false)}
        />
      )}
      {cellLevelUploadVisible && (
        <CellLevelUploadModal
          uploading={cellLevelUploading}
          cellLevelMetadata={cellLevelMetadata}
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
