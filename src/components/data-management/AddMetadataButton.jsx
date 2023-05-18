import React, { useState } from 'react';
import {
  Menu, Dropdown, Button,
} from 'antd';
import PropTypes from 'prop-types';

import { useSelector, useDispatch } from 'react-redux';

import uploadMetadataFile from 'redux/actions/experiments/uploadMetadataFile';
import MetadataUploadModal from './MetadataUploadModal';

const AddMetadataButton = ({ samplesTableRef }) => {
  const dispatch = useDispatch();
  const { activeExperimentId } = useSelector((state) => state.experiments.meta);
  const activeExperiment = useSelector((state) => state.experiments[activeExperimentId]);
  const isSubsetted = activeExperiment?.isSubsetted;
  const [uploadModalVisible, setUploadModalVisible] = useState(false);

  const uploadFiles = (file) => {
    dispatch(uploadMetadataFile(activeExperimentId, file));
    setUploadModalVisible(false);
  };

  return (
    <>
      <Dropdown
        overlay={() => (
          <Menu>
            <Menu.Item
              key='add-metadata-column'
              onClick={() => samplesTableRef.current.createMetadataColumn()}
            >
              Create track
            </Menu.Item>
            <Menu.Item
              key='upload-metadata-file'
              onClick={() => {
                setUploadModalVisible(true);
              }}
            >
              Upload file
            </Menu.Item>
          </Menu>
        )}
        trigger={['click']}
        placement='bottomRight'
        disabled={activeExperiment.sampleIds?.length === 0 || isSubsetted}
      >
        <Button>
          Add metadata
        </Button>
      </Dropdown>
      {uploadModalVisible && (
        <MetadataUploadModal
          onUpload={uploadFiles}
          onCancel={() => setUploadModalVisible(false)}
        />
      )}
    </>
  );
};

AddMetadataButton.propTypes = {
  samplesTableRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
};

export default AddMetadataButton;
