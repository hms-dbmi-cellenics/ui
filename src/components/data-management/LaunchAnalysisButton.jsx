import React, { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Button, Tooltip, Popconfirm,
} from 'antd';
import { modules } from 'utils/constants';

import fileUploadSpecifications from 'utils/upload/fileUploadSpecifications';
import UploadStatus from 'utils/upload/UploadStatus';
import integrationTestConstants from 'utils/integrationTestConstants';
import { runGem2s } from 'redux/actions/pipeline';
import calculateGem2sRerunStatus from 'utils/data-management/calculateGem2sRerunStatus';

import { useAppRouter } from 'utils/AppRouteProvider';

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

  const [gem2sRerunStatus, setGem2sRerunStatus] = useState(
    { rerun: true, reasons: [] },
  );

  const launchAnalysis = async () => {
    if (gem2sRerunStatus.rerun) {
      await dispatch(runGem2s(activeExperimentId));
    }
    navigateTo(modules.DATA_PROCESSING, { experimentId: activeExperimentId });
  };

  useEffect(() => {
    // The value of backend status is null for new experiments that have never run
    const gem2sBackendStatus = backendStatus[activeExperimentId]?.status?.gem2s;

    if (
      !gem2sBackendStatus
      || !experiments[activeExperimentId]?.sampleIds?.length > 0
    ) return;

    const status = calculateGem2sRerunStatus(gem2sBackendStatus, activeExperiment);
    setGem2sRerunStatus(status);
  }, [backendStatus, activeExperimentId, samples, activeExperiment]);

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
    });
    return canLaunch;
  }, [samples, activeExperiment?.sampleIds, activeExperiment?.metadataKeys]);

  const renderLaunchButton = () => {
    const buttonText = !gem2sRerunStatus.rerun ? 'Go to Data Processing' : 'Process project';

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
