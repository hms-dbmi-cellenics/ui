import React, { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Tooltip, Popconfirm } from 'antd';
import { useRouter } from 'next/router';
import moment from 'moment';
import {
  updateProject,
} from '../../redux/actions/projects';

import fileUploadSpecifications from '../../utils/upload/fileUploadSpecifications';
import UploadStatus from '../../utils/upload/UploadStatus';
import pipelineStatus from '../../utils/pipelineStatusValues';
import integrationTestConstants from '../../utils/integrationTestConstants';
import generateGem2sParamsHash from '../../utils/data-management/generateGem2sParamsHash';
import { runGem2s } from '../../redux/actions/pipeline';
import { updateExperiment } from '../../redux/actions/experiments';

import LaunchAnalysisModal from './LaunchAnalysisModal';

const LaunchButtonTemplate = (props) => {
  // eslint-disable-next-line react/prop-types
  const { onClick, disabled, text } = props;

  return (
    <Button
      data-test-id={integrationTestConstants.ids.LAUNCH_ANALYSIS_BUTTON}
      type='primary'
      disabled={disabled}
      onClick={onClick}
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

  const [gem2sRerunStatus, setGem2sRerunStatus] = useState({ rerun: true, hash: null, reasons: [] });
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);

  const launchAnalysis = (experimentId) => {
    const analysisPath = '/experiments/[experimentId]/data-processing';
    const lastViewed = moment().toISOString();

    dispatch(updateExperiment(experimentId, { lastViewed }));
    dispatch(updateProject(activeProjectUuid, { lastAnalyzed: lastViewed }));

    if (gem2sRerunStatus.rerun) {
      dispatch(runGem2s(experimentId, gem2sRerunStatus.hash));
    }

    router.push(analysisPath.replace('[experimentId]', experimentId));
  };

  const calculateGem2sRerunStatus = (experimentId, gem2sBackendStatus) => {
    const rerunReasons = [];

    const { status: gem2sStatus, paramsHash: existingParamsHash } = gem2sBackendStatus;

    const gem2sSuccessful = [
      pipelineStatus.SUCCEEDED, pipelineStatus.RUNNING,
    ].includes(gem2sStatus);

    const newParamsHash = generateGem2sParamsHash(
      activeProject,
      samples,
      experiments[experimentId],
    );

    const projectHashEqual = existingParamsHash === newParamsHash;

    if (!gem2sSuccessful) rerunReasons.push('data has not been processed sucessfully');
    if (!projectHashEqual) rerunReasons.push('the project samples/metadata have been modified');

    return ({
      rerun: !gem2sSuccessful || !projectHashEqual,
      hash: newParamsHash,
      reasons: rerunReasons,
    });
  };

  useEffect(() => {
    const experimentId = activeProject.experiments[0];

    const gem2sBackendStatus = backendStatus[experimentId]?.status?.gem2s;

    if (
      !gem2sBackendStatus
      || !experiments[experimentId]?.sampleIds.length > 0
    ) return;

    const gem2sStatus = calculateGem2sRerunStatus(experimentId, backendStatus);

    setGem2sRerunStatus(gem2sStatus);
  }, [backendStatus, activeProjectUuid, samples, activeProject]);

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

    if (!canLaunchAnalysis()) {
      return (
        <Tooltip
          title='Ensure all samples are uploaded and all metadata are inserted'
        >
          {/* disabled button inside tooltip causes tooltip to not function */}
          {/* https://github.com/react-component/tooltip/issues/18#issuecomment-140078802 */}
          <span>
            <LaunchButtonTemplate text={buttonText} disabled onClick={() => setAnalysisModalVisible(true)} />
          </span>
        </Tooltip>
      );
    }

    // Popconfirm
    if (gem2sRerunStatus.rerun) {
      return (
        <Popconfirm
          title={`This project has to be processed because ${gem2sRerunStatus.reasons.join(' and ')}. \
            This will take several minutes.\
            Do you want to continue?`}
          onConfirm={() => setAnalysisModalVisible(true)}
          okText='Yes'
          cancelText='No'
          placement='bottom'
          overlayStyle={{ maxWidth: '250px' }}
        >
          <LaunchButtonTemplate text={buttonText} />
        </Popconfirm>
      );
    }

    return <LaunchButtonTemplate text={buttonText} onClick={() => setAnalysisModalVisible(true)} />;
  };

  return (
    <>
      {renderLaunchButton()}
      {analysisModalVisible ? (
        <LaunchAnalysisModal
          onLaunch={(experimentId) => {
            setAnalysisModalVisible(false);
            launchAnalysis(experimentId);
          }}
          onCancel={() => setAnalysisModalVisible(false)}
        />
      ) : <></>}
    </>
  );
};

export default LaunchAnalysisButton;
