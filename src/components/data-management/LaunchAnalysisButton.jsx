import React, { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Button, Tooltip, Popconfirm, Typography, Space,
} from 'antd';
import _ from 'lodash';

import { modules, sampleTech } from 'utils/constants';

import UploadStatus from 'utils/upload/UploadStatus';
import integrationTestConstants from 'utils/integrationTestConstants';

import { useAppRouter } from 'utils/AppRouteProvider';
import calculatePipelinesRerunStatus from 'utils/data-management/calculatePipelinesRerunStatus';
import { WarningOutlined } from '@ant-design/icons';

const { Text } = Typography;

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

    const allSampleFilesUploaded = (sample) => (
      Object.values(sample.files).every((file) => file.upload.status === UploadStatus.UPLOADED)
    );

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

  const getAllExperimentSampleFiles = useCallback(() => (
    activeExperiment.sampleIds.flatMap((sampleId) => Object.values(samples[sampleId]?.files ?? {}))
  ), [samples, activeExperiment?.sampleIds]);

  const getAnyFileUploadFailed = useCallback(() => {
    const nonErrorStatuses = [UploadStatus.UPLOADED, UploadStatus.UPLOADING];

    const cellLevelUploadError = !_.isNil(activeExperiment.cellLevelMetadata)
      && !nonErrorStatuses.includes(activeExperiment.cellLevelMetadata.uploadStatus);

    const sampleFileUploadError = getAllExperimentSampleFiles()
      .some((sampleFile) => !nonErrorStatuses.includes(sampleFile.upload.status));

    return cellLevelUploadError || sampleFileUploadError;
  }, [
    samples,
    activeExperiment?.sampleIds,
    activeExperiment.cellLevelMetadata,
  ]);

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
        {
          getAnyFileUploadFailed() ? (
            <Space>
              <Text type='danger'>
                <WarningOutlined />
              </Text>
              {text}
            </Space>
          ) : (
            text
          )
        }

      </Button>
    );
  };

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
      const message = !cellLevelMetadataIsReady
        ? 'Ensure that the cell level metadata file is uploaded correctly'
        : 'Ensure that all samples are uploaded successfully and all relevant metadata is inserted.';
      return (
        <Tooltip
          title={message}
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
