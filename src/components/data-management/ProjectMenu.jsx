import React, {
  useState, useEffect, useCallback, useMemo,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import sha1 from 'crypto-js/sha1';
import Hex from 'crypto-js/enc-hex';
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
import integrationTestIds from '../../utils/integrationTestIds';

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

    const generateGem2sHashParams = (project) => {
      const experiment = experiments[experimentId];
      const experimentSamples = project.samples.map((sampleUuid) => samples[sampleUuid]);

      const samplesEntries = Object.entries(experimentSamples);

      // Different sample order should not change the hash.
      const orderInvariantSampleIds = [...experiment.sampleIds].sort();

      const hashParams = {
        organism: experiment.meta.organism,
        input: { type: experiment.meta.type },
        sampleIds: orderInvariantSampleIds,
        sampleNames: orderInvariantSampleIds.map((sampleId) => samples[sampleId].name),
      };

      if (project.metadataKeys.length) {
        hashParams.metadata = project.metadataKeys.reduce((acc, key) => {
        // Make sure the key does not contain '-' as it will cause failure in GEM2S
          const sanitizedKey = key.replace(/-+/g, '_');

          acc[sanitizedKey] = samplesEntries.map(
            ([, sample]) => sample.metadata[key] || DEFAULT_NA,
          );
          return acc;
        }, {});
      }

      return Hex.stringify(sha1(JSON.stringify(hashParams)));
    };

    const reasons = [];

    const gem2sStatus = backendStatus[experimentId]?.status.gem2s?.status;

    const gem2sSuccessful = [
      pipelineStatus.SUCCEEDED, pipelineStatus.RUNNING,
    ].includes(gem2sStatus);

    const paramsHash = backendStatus[experimentId]?.status.gem2s?.paramsHash;

    const projectHashEqual = paramsHash && paramsHash === generateGem2sHashParams(activeProject);

    if (!gem2sSuccessful) reasons.push('data has not been processed sucessfully');
    if (!projectHashEqual) reasons.push('the project has been modified');

    setGem2sRerunStatus({
      rerun: !gem2sSuccessful || !projectHashEqual,
      reasons,
    });
  }, [backendStatus, activeProjectUuid, samples, activeProject]);

  const renderTooltipButton = useCallback(() => {
    const LaunchButton = (props) => {
      const { onClick } = props;

      return (
        <Button
          data-test-id={integrationTestIds.id.LAUNCH_ANALYSIS_BUTTON}
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
          <LaunchButton onClick={() => setAnalysisModalVisible(true)} />
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
