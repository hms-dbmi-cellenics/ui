import React, { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Button, Tooltip, Popconfirm,
} from 'antd';
import { useRouter } from 'next/router';
import moment from 'moment';
import { updateExperimentInfo } from 'redux/actions/experimentSettings';
import {
  updateProject,
} from 'redux/actions/projects';

import fileUploadSpecifications from 'utils/upload/fileUploadSpecifications';
import UploadStatus from 'utils/upload/UploadStatus';
import pipelineStatus from 'utils/pipelineStatusValues';
import integrationTestConstants from 'utils/integrationTestConstants';
import generateGem2sParamsHash from 'utils/data-management/generateGem2sParamsHash';
import { runGem2s } from 'redux/actions/pipeline';
import { updateExperiment, switchExperiment } from 'redux/actions/experiments';

const LaunchButtonTemplate = (props) => {
  const {
    // eslint-disable-next-line react/prop-types
    onClick, disabled, text, loading,
  } = props;

  return (
    <Button
      data-test-id={integrationTestConstants.ids.PROCESS_PROJECT_BUTTON}
      type='primary'
      disabled={disabled}
      onClick={onClick}
      loading={loading}
    >
      {text}
    </Button>
  );
};

const LaunchAnalysisButton = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const experiments = useSelector((state) => state.experiments);
  const samples = useSelector((state) => state.samples);
  const backendStatus = useSelector((state) => state.backendStatus);

  const projects = useSelector((state) => state.projects);
  const { activeProjectUuid } = projects.meta;
  const activeProject = projects[activeProjectUuid];
  const experimentId = activeProject.experiments[0];

  const [gem2sRerunStatus, setGem2sRerunStatus] = useState({ rerun: true, paramsHash: null, reasons: [] });

  const launchAnalysis = () => {
    const lastViewed = moment().toISOString();
    dispatch(updateExperiment(experimentId, { lastViewed }));
    dispatch(updateProject(activeProjectUuid, { lastAnalyzed: lastViewed }));
    dispatch(switchExperiment());
    dispatch(updateExperimentInfo({
      experimentId,
      experimentName: experiments[experimentId].name,
      sampleIds: experiments[experimentId].sampleIds,
    }));

    if (gem2sRerunStatus.rerun) {
      dispatch(runGem2s(experimentId, gem2sRerunStatus.paramsHash));
    }

    const analysisPath = '/experiments/[experimentId]/data-processing';
    router.push(analysisPath.replace('[experimentId]', experimentId));
  };

  const calculateGem2sRerunStatus = (gem2sBackendStatus) => {
    const { status: gem2sStatus, paramsHash: existingParamsHash } = gem2sBackendStatus;

    const newParamsHash = generateGem2sParamsHash(
      activeProject,
      samples,
      experiments[experimentId],
    );

    const projectHashEqual = existingParamsHash === newParamsHash;

    const gem2sSuccessful = [
      pipelineStatus.SUCCEEDED, pipelineStatus.RUNNING,
    ].includes(gem2sStatus);

    const rerunReasons = [];
    if (!gem2sSuccessful) rerunReasons.push('data has not been processed sucessfully');
    if (!projectHashEqual) rerunReasons.push('the project samples/metadata have been modified');

    return ({
      rerun: !gem2sSuccessful || !projectHashEqual,
      paramsHash: newParamsHash,
      reasons: rerunReasons,
    });
  };

  useEffect(() => {
    // The value of backend status is null for new projects that have never run
    const gem2sBackendStatus = backendStatus[experimentId]?.status?.gem2s;

    if (
      !gem2sBackendStatus
      || !experiments[experimentId]?.sampleIds?.length > 0
    ) return;

    const gem2sStatus = calculateGem2sRerunStatus(gem2sBackendStatus);

    setGem2sRerunStatus(gem2sStatus);
  }, [backendStatus, activeProjectUuid, samples, activeProject]);

  const canLaunchAnalysis = useCallback(() => {
    if (activeProject.samples.length === 0) return false;

    // Check that samples is loaded
    const testSampleUuid = activeProject.samples[0];
    if (samples[testSampleUuid] === undefined) return false;

    const metadataKeysAvailable = activeProject.metadataKeys.length;

    const allSampleFilesUploaded = (sample) => {
      // Check if all files for a given tech has been uploaded
      const { fileNames } = sample;
      if (
        !fileUploadSpecifications[sample.type].requiredFiles.every(
          (file) => fileNames.includes(file),
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
        .every((value) => value.length > 0);
    };

    const canLaunch = activeProject.samples.every((sampleUuid) => {
      const checkedSample = samples[sampleUuid];
      return allSampleFilesUploaded(checkedSample)
        && allSampleMetadataInserted(checkedSample);
    });
    return canLaunch;
  }, [samples, activeProject.samples, activeProject.metadataKeys]);

  const renderLaunchButton = () => {
    const buttonText = !gem2sRerunStatus.rerun ? 'Go to Data Processing' : 'Process project';

    if (!backendStatus[experimentId] || backendStatus[experimentId]?.loading) {
      return <LaunchButtonTemplate text='Loading project...' disabled loading />;
    }

    // Popconfirm
    if (gem2sRerunStatus.rerun) {
      return (
        <Popconfirm
          title={`This project has to be processed because ${gem2sRerunStatus.reasons.join(' and ')}. \
        This will take several minutes.\
        Do you want to continue?`}
          onConfirm={() => launchAnalysis()}
          okText='Yes'
          okButtonProps={{ 'data-test-id': integrationTestConstants.ids.CONFIRM_PROCESS_PROJECT }}
          cancelText='No'
          placement='bottom'
          overlayStyle={{ maxWidth: '250px' }}
        >
          <LaunchButtonTemplate text={buttonText} />
        </Popconfirm>
      );
    }

    return <LaunchButtonTemplate text={buttonText} onClick={() => launchAnalysis()} />;
  };

  return renderLaunchButton();
};

export default LaunchAnalysisButton;
