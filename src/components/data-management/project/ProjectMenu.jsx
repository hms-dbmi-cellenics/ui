import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Space, Button,
} from 'antd';

import integrationTestConstants from 'utils/integrationTestConstants';
import processUpload from 'utils/upload/processUpload';
import DownloadDataButton from 'components/data-management/DownloadDataButton';
import LaunchAnalysisButton from 'components/data-management/LaunchAnalysisButton';
import FileUploadModal from 'components/data-management/FileUploadModal';
import ShareExperimentModal from 'components/data-management/ShareExperimentModal';

const ProjectMenu = () => {
  const dispatch = useDispatch();
  const samples = useSelector((state) => state.samples);
  const activeExperimentId = useSelector((state) => state.experiments.meta.activeExperimentId);
  const activeExperiment = useSelector((state) => state.experiments[activeExperimentId]);
  const isSubsetted = activeExperiment?.isSubsetted;

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [shareExperimentModalVisible, setShareExperimentModalVisible] = useState(false);
  const selectedTech = samples[activeExperiment?.sampleIds[0]]?.type;

  const uploadFiles = (filesList, sampleType) => {
    processUpload(filesList, sampleType, samples, activeExperimentId, dispatch);
    setUploadModalVisible(false);
  };

  return (
    <>
      <Space>
        <Button
          data-test-id={integrationTestConstants.ids.ADD_SAMPLES_BUTTON}
          onClick={() => setUploadModalVisible(true)}
          disabled={isSubsetted}
        >
          Add data
        </Button>
        <DownloadDataButton />
        <Button
          onClick={() => setShareExperimentModalVisible(!shareExperimentModalVisible)}
        >
          Share
        </Button>

        {shareExperimentModalVisible && (
          <ShareExperimentModal
            onCancel={() => setShareExperimentModalVisible(false)}
            experiment={activeExperiment}
          />
        )}
        <LaunchAnalysisButton />
      </Space>
      {uploadModalVisible ? (
        <FileUploadModal
          onUpload={uploadFiles}
          currentSelectedTech={selectedTech}
          onCancel={() => setUploadModalVisible(false)}
        />
      ) : <></>}
    </>
  );
};

export default ProjectMenu;
