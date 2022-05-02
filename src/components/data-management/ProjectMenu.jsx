import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Space, Button,
} from 'antd';
import integrationTestConstants from 'utils/integrationTestConstants';
import processUpload from 'utils/upload/processUpload';
import DownloadDataButton from './DownloadDataButton';
import LaunchAnalysisButton from './LaunchAnalysisButton';
import FileUploadModal from './FileUploadModal';
import ShareExperimentModal from './ShareExperimentModal';

const ProjectMenu = () => {
  const dispatch = useDispatch();
  const samples = useSelector((state) => state.samples);
  const activeProjectUuid = useSelector((state) => state.projects.meta.activeProjectUuid);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [shareExperimentModalVisible, setShareExperimentModalVisible] = useState(false);
  const activeProject = useSelector((state) => state.projects[activeProjectUuid]);

  const uploadFiles = (filesList, sampleType) => {
    processUpload(filesList, sampleType, samples, activeProjectUuid, dispatch);
    setUploadModalVisible(false);
  };

  return (
    <>
      <Space>
        <Button
          data-test-id={integrationTestConstants.ids.ADD_SAMPLES_BUTTON}
          onClick={() => setUploadModalVisible(true)}
        >
          Add samples
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
            activeProject={activeProject}
          />
        )}
        <LaunchAnalysisButton />
      </Space>
      {uploadModalVisible ? (
        <FileUploadModal
          onUpload={uploadFiles}
          onCancel={() => setUploadModalVisible(false)}
        />
      ) : <></>}
    </>
  );
};
export default ProjectMenu;
