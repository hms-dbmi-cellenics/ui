import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Space, Button,
} from 'antd';
import DownloadData from './DownloadData';
import fileUploadSpecifications from '../../utils/upload/fileUploadSpecifications';
import UploadStatus from '../../utils/upload/UploadStatus';
<<<<<<< HEAD
import integrationTestConstants from '../../utils/integrationTestConstants';

const { Title, Text, Paragraph } = Typography;
=======
import FileUploadModal from './FileUploadModal';
import AnalysisModal from './AnalysisModal';
import { processUpload } from '../../utils/upload/processUpload';
import integrationTestConstants from '../../utils/integrationTestConstants';
>>>>>>> master

const ProjectMenu = () => {
  const dispatch = useDispatch();

  const { activeProjectUuid } = useSelector((state) => state.projects.meta);
  const activeProject = useSelector((state) => state.projects[activeProjectUuid]);
  const projects = useSelector((state) => state.projects);
  const samples = useSelector((state) => state.samples);
  const anyProjectsAvailable = projects?.ids?.length;
  const metadataKeysAvailable = activeProject?.metadataKeys?.length;
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);

  const canLaunchAnalysis = () => {
    if (activeProject?.samples?.length === 0 || !anyProjectsAvailable) return false;

    const allSampleFilesUploaded = (sample) => {
      // Check if all files for a given tech has been uploaded
      const fileNamesArray = Array.from(sample.fileNames);
      if (
        fileUploadSpecifications[sample.type].requiredFiles.every(
          (file) => !fileNamesArray.includes(file),
        )
      ) { return false; }
      return fileNamesArray.every((fileName) => {
        const checkedFile = sample.files[fileName];
        return checkedFile.valid && checkedFile.upload.status === UploadStatus.UPLOADED;
      });
    };

    const allSampleMetadataInserted = (sample) => {
      if (!metadataKeysAvailable) return true;
      if (Object.keys(sample.metadata).length !== metadataKeysAvailable) return false;
      return Object.values(sample.metadata).every((value) => value && value.length > 0);
    };

    const canLaunch = activeProject?.samples?.every((sampleUuid) => {
      const checkedSample = samples[sampleUuid];
      return allSampleFilesUploaded(checkedSample)
        && allSampleMetadataInserted(checkedSample);
    });
    return canLaunch;
  };

  const uploadFiles = (filesList, sampleType) => {
    processUpload(filesList, sampleType, samples, activeProjectUuid, dispatch);
    setUploadModalVisible(false);
  };

  return (
    <>
      <Space>
        <Button
          data-test-id={integrationTestConstants.ids.ADD_SAMPLES_BUTTON}
          disabled={!anyProjectsAvailable}
          onClick={() => setUploadModalVisible(true)}
        >
          Add samples
        </Button>
        <DownloadData />
        <Button
          data-test-id={integrationTestConstants.ids.LAUNCH_ANALYSIS_BUTTON}
          type='primary'
          disabled={!canLaunchAnalysis()}
          onClick={() => setAnalysisModalVisible(true)}
        >
          Launch analysis
        </Button>
      </Space>
      {uploadModalVisible ? (
        <FileUploadModal
          onUpload={uploadFiles}
          onCancel={() => setUploadModalVisible(false)}
        />
      ) : <></>}
      {analysisModalVisible ? (
        <AnalysisModal
          onLaunch={() => { setAnalysisModalVisible(false); }}
          onCancel={() => { setAnalysisModalVisible(false); }}
        />
      ) : <></>}
    </>
  );
};
export default ProjectMenu;
