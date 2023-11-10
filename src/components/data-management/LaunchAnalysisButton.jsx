import React, { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Button, Tooltip, Popconfirm,
} from 'antd';
import _ from 'lodash';

import { modules, sampleTech } from 'utils/constants';

import fileUploadSpecifications from 'utils/upload/fileUploadSpecifications';
import UploadStatus from 'utils/upload/UploadStatus';
import integrationTestConstants from 'utils/integrationTestConstants';

import { useAppRouter } from 'utils/AppRouteProvider';
import calculatePipelinesRerunStatus from 'utils/data-management/calculatePipelinesRerunStatus';

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
  const { navigateTo } = useAppRouter();

  const experiments = useSelector((state) => state.experiments);
  const samples = useSelector((state) => state.samples);
  const backendStatus = useSelector((state) => state.backendStatus);

  const { activeExperimentId } = experiments.meta;
  const activeExperiment = experiments[activeExperimentId];
  const selectedTech = samples[activeExperiment?.sampleIds[0]]?.type;
  const isTechSeurat = selectedTech === sampleTech.SEURAT;

  const [pipelinesRerunStatus, setPipelinesRerunStatus] = useState({
    runPipeline: null, rerun: true, reasons: [], complete: false,
  });

  const launchAnalysis = async () => {
    let shouldNavigate = true;
    if (pipelinesRerunStatus.rerun) {
      shouldNavigate = await dispatch(pipelinesRerunStatus.runPipeline(activeExperimentId));
    }

    if (shouldNavigate) {
      const moduleName = isTechSeurat && pipelinesRerunStatus.complete
        ? modules.DATA_EXPLORATION : modules.DATA_PROCESSING;
      navigateTo(moduleName, { experimentId: activeExperimentId });
    }
  };

  useEffect(() => {
    // The value of backend status is null for new experiments that have never run
    const setupPipeline = isTechSeurat ? 'seurat' : 'gem2s';
    const {
      pipeline: qcBackendStatus, [setupPipeline]: setupBackendStatus,
    } = backendStatus[activeExperimentId]?.status ?? {};

    if (
      !setupBackendStatus
      || !experiments[activeExperimentId]?.sampleIds?.length > 0
    ) return;

    setPipelinesRerunStatus(
      calculatePipelinesRerunStatus(
        setupBackendStatus,
        qcBackendStatus,
        activeExperiment,
        isTechSeurat,
      ),
    );
  }, [backendStatus, activeExperimentId, samples, activeExperiment]);

  const cellLevelMetadataIsReady = (
    _.isNil(activeExperiment.cellLevelMetadata)
    || activeExperiment.cellLevelMetadata.uploadStatus === UploadStatus.UPLOADED
  );

  const canLaunchAnalysis = useCallback(() => {
    if (activeExperiment.sampleIds.length === 0) return false;

    // Check that samples is loaded
    const testSampleUuid = activeExperiment.sampleIds[0];
    if (samples[testSampleUuid] === undefined) return false;

    const metadataKeysAvailable = activeExperiment.metadataKeys.length;

    const allSampleFilesUploaded = (sample) => {
      // Check if all files for a given tech has been uploaded
      const { fileNames } = sample;
      if (
        !fileUploadSpecifications[sample.type].requiredFiles.every(
          (file) => fileNames.includes(file.key),
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

    const canLaunch = activeExperiment.sampleIds.every((sampleUuid) => {
      if (!samples[sampleUuid]) return false;

      const checkedSample = samples[sampleUuid];

      return allSampleFilesUploaded(checkedSample)
        && allSampleMetadataInserted(checkedSample);
    }) && cellLevelMetadataIsReady;

    return canLaunch;
  }, [
    samples,
    activeExperiment?.sampleIds,
    activeExperiment?.metadataKeys,
    activeExperiment.cellLevelMetadata?.uploadStatus,
  ]);

  const renderLaunchButton = () => {
    let buttonText;

    if (pipelinesRerunStatus.rerun) {
      buttonText = 'Process project';
    } else if (isTechSeurat && pipelinesRerunStatus.complete) {
      buttonText = 'Go to Data Exploration';
    } else {
      buttonText = 'Go to Data Processing';
    }

    if (!backendStatus[activeExperimentId] || backendStatus[activeExperimentId]?.loading) {
      return <LaunchButtonTemplate text='Loading project...' disabled loading />;
    }

    if (!canLaunchAnalysis()) {
      return (
        <Tooltip
          title='Ensure that all samples are uploaded successfully and all relevant metadata is inserted.'
        >
          {/* disabled button inside tooltip causes tooltip to not function */}
          {/* https://github.com/react-component/tooltip/issues/18#issuecomment-140078802 */}
          <span>
            <LaunchButtonTemplate text={buttonText} disabled />
          </span>
        </Tooltip>
      );
    }

    if (pipelinesRerunStatus.rerun) {
      return (
        <Popconfirm
          title={`This project has to be processed because ${pipelinesRerunStatus.reasons.join(' and ')}. \
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
