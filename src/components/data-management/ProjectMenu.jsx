import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Space, Button,
} from 'antd';
import integrationTestConstants from 'utils/integrationTestConstants';
import { process10XUpload, processSeuratUpload } from 'utils/upload/processUpload';
import { sampleTech } from 'utils/constants';
import DownloadDataButton from './DownloadDataButton';
import LaunchAnalysisButton from './LaunchAnalysisButton';
import FileUploadModal from './FileUploadModal';
import ShareExperimentModal from './ShareExperimentModal';

const ProjectMenu = (props) => {
  const { technology } = props;
  const dispatch = useDispatch();
  const samples = useSelector((state) => state.samples);
  const activeExperimentId = useSelector((state) => state.experiments.meta.activeExperimentId);
  const activeExperiment = useSelector((state) => state.experiments[activeExperimentId]);

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [shareExperimentModalVisible, setShareExperimentModalVisible] = useState(false);
  const selectedTech = samples[activeExperiment?.sampleIds[0]]?.type;

  const uploadFiles = (filesList, sampleType) => {
    if (sampleType === sampleTech['10X']) {
      process10XUpload(filesList, sampleType, samples, activeExperimentId, dispatch);
    } else if (sampleType === sampleTech.SEURAT) {
      processSeuratUpload(filesList, sampleType, samples, activeExperimentId, dispatch);
    }
    setUploadModalVisible(false);
  };

  return (
    <>
      <Space>
        <Button
          data-test-id={integrationTestConstants.ids.ADD_SAMPLES_BUTTON}
          onClick={() => setUploadModalVisible(true)}
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
        <LaunchAnalysisButton technology={technology} />
      </Space>
      {uploadModalVisible ? (
        <FileUploadModal
          onUpload={uploadFiles}
          currentSelectedTech={selectedTech}
          onCancel={() => setUploadModalVisible(false)}
          previousDataTechnology={technology}
        />
      ) : <></>}
    </>
  );
};
export default ProjectMenu;
