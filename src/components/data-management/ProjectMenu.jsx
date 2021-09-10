import React, {
  useState, useEffect, useCallback,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Space, Button, Tooltip, Popconfirm,
} from 'antd';
import pipelineStatus from '../../utils/pipelineStatusValues';
import { DEFAULT_NA } from '../../redux/reducers/projects/initialState';
import DownloadData from './DownloadData';
import fileUploadSpecifications from '../../utils/upload/fileUploadSpecifications';
import UploadStatus from '../../utils/upload/UploadStatus';
import FileUploadModal from './FileUploadModal';
import AnalysisModal from './AnalysisModal';
import { processUpload } from '../../utils/upload/processUpload';
import generateGem2sHashParams from '../../utils/data-management/generateGem2sHashParams';
import integrationTestConstants from '../../utils/integrationTestConstants

const ProjectMenu = () => {
  const dispatch = useDispatch();

  const { activeProjectUuid } = useSelector((state) => state.projects.meta);
  const experiments = useSelector((state) => state.experiments);
  const activeProject = useSelector((state) => state.projects[activeProjectUuid]);
  const samples = useSelector((state) => state.samples);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);
  const [gem2sRerunStatus, setGem2sRerunStatus] = useState({ rerun: true, reasons: [] });
  const backendStatus = useSelector((state) => state.backendStatus);

  const canLaunchAnalysis = useCallback(() => {
    if (activeProject.samples.length === 0) return false;

    const metadataKeysAvailable = activeProject.metadataKeys.length;

    const allSampleFilesUploaded = (sample) => {
      // Check if all files for a given tech has been uploaded
      const { fileNames } = sample;
      if (
        fileUploadSpecifications[sample.type].requiredFiles.every(
          (file) => !fileNames.includes(file),
        )
      ) { return false; }

      let allUploaded = true;

      // eslint-disable-next-line no-restricted-syntax
      for (const fileName of fileNames) {
        const checkedFile = sample.files[fileName];
        allUploaded = allUploaded
        && checkedFile.valid
        && checkedFile.upload.status === UploadStatus.UPLOADED;

        if (!allUploaded) break;
      }

      return allUploaded;
    };

    const allSampleMetadataInserted = (sample) => {
      if (!metadataKeysAvailable) return true;
      if (Object.keys(sample.metadata).length !== metadataKeysAvailable) return false;
      return Object.values(sample.metadata)
        .every((value) => value.length > 0 && value !== DEFAULT_NA);
    };

    const canLaunch = activeProject.samples.every((sampleUuid) => {
      const checkedSample = samples[sampleUuid];
      return allSampleFilesUploaded(checkedSample)
        && allSampleMetadataInserted(checkedSample);
    });
    return canLaunch;
  }, [samples, activeProject.samples, activeProject.metadataKeys]);

  // Initialize hash for each project
  useEffect(() => {
    const experimentId = activeProject.experiments[0];

    if (!experiments[experimentId]?.sampleIds.length > 0) return;

    const reasons = [];

    const gem2sStatus = backendStatus[experimentId]?.status.gem2s?.status;

    const gem2sSuccessful = [
      pipelineStatus.SUCCEEDED, pipelineStatus.RUNNING,
    ].includes(gem2sStatus);

    const existingParamsHash = backendStatus[experimentId]?.status.gem2s?.paramsHash;
    const newParamsHash = generateGem2sHashParams(activeProject, samples, experiments[experimentId]);

    const projectHashEqual = existingParamsHash && existingParamsHash === newParamsHash;

    if (!gem2sSuccessful) reasons.push('data has not been processed sucessfully');
    if (!projectHashEqual) reasons.push('the project has been modified');

    setGem2sRerunStatus({
      rerun: !gem2sSuccessful || !projectHashEqual,
      reasons,
    });
  }, [backendStatus, activeProjectUuid, samples, activeProject]);

  const renderTooltipButton = useCallback(() => {
    const LaunchButton = (props) => {
      // eslint-disable-next-line react/prop-types
      const { onClick } = props;

      return (
        <Button
          data-test-id={integrationTestConstants.ids.LAUNCH_ANALYSIS_BUTTON}
          type='primary'
          disabled={!canLaunchAnalysis()}
          onClick={onClick}
        >
          {
            gem2sRerunStatus.rerun
              ? 'Process project'
              : 'Go to Data Processing'
          }
        </Button>
      );
    };

    if (activeProject.samples.length > 0 && !canLaunchAnalysis()) {
      return (
        <Tooltip
          title={`Ensure all samples are uploaded and all metadata are inserted (no ${DEFAULT_NA})`}
        >
          {/* disabled button inside tooltip causes tooltip to not function */}
          {/* https://github.com/react-component/tooltip/issues/18#issuecomment-140078802 */}
          <span>
            <LaunchButton onClick={() => setAnalysisModalVisible(true)} />
          </span>
        </Tooltip>
      );
    }

    // Popconfirm
    if (gem2sRerunStatus.rerun) {
      return (
        <Popconfirm
          title={`This project has to be processed because ${gem2sRerunStatus.reasons.join(' and ')}. \
            This might take a while.\
            Do you want to continue?`}
          onConfirm={() => setAnalysisModalVisible(true)}
          okText='Yes'
          cancelText='No'
          placement='bottom'
          overlayStyle={{ maxWidth: '250px' }}
        >
          <LaunchButton />
        </Popconfirm>
      );
    }

    return <LaunchButton onClick={() => setAnalysisModalVisible(true)} />;
  }, [activeProject.samples, gem2sRerunStatus]);

  const uploadFiles = (filesList, sampleType) => {
    processUpload(filesList, sampleType, samples, activeProjectUuid, dispatch);
    setUploadModalVisible(false);
  };

  return (
    <>
      <Space>
        <Button
          onClick={() => setUploadModalVisible(true)}
        >
          Add samples
        </Button>
        <DownloadData />
        {renderTooltipButton()}
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
