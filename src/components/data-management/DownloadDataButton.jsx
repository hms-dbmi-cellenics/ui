import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import {
  Tooltip, Dropdown, Button, Space,
} from 'antd';

import { useSelector, useDispatch } from 'react-redux';
import { saveAs } from 'file-saver';
import { ClipLoader } from 'react-spinners';

import downloadTypes from 'utils/data-management/downloadTypes';
import endUserMessages from 'utils/endUserMessages';
import pipelineStatus from 'utils/pipelineStatusValues';
import { exportQCParameters, filterQCParameters } from 'utils/data-management/exportQCParameters';

import { loadBackendStatus } from 'redux/actions/backendStatus/index';

import { getBackendStatus } from 'redux/selectors';
import handleError from 'utils/http/handleError';
import downloadProcessedMatrix from 'utils/extraActionCreators/downloadProcessedMatrix';

const DownloadDataButton = () => {
  const dispatch = useDispatch();
  const experimentSettings = useSelector((state) => state.experimentSettings);
  const experiments = useSelector((state) => state.experiments);
  const { activeExperimentId } = experiments.meta;
  const activeExperiment = experiments[activeExperimentId];

  const {
    status: backendStatuses, loading: backendLoading,
  } = useSelector(getBackendStatus(activeExperimentId));

  const samples = useSelector((state) => state.samples);
  const [pipelineHasRun, setPipelineHasRun] = useState(false);
  const [allSamplesAnalysed, setAllSamplesAnalysed] = useState(false);
  const [downloadingProcessedSeurat, setDownloadingProcessedSeurat] = useState(false);
  const [dropdownExpanded, setDropdownExpanded] = useState(false);

  useEffect(() => {
    if (activeExperimentId && !backendLoading && !backendStatuses) {
      dispatch(loadBackendStatus(activeExperimentId));
    }
  }, [activeExperimentId]);

  useEffect(() => {
    setPipelineHasRun(
      activeExperimentId && (backendStatuses?.pipeline?.status === pipelineStatus.SUCCEEDED
        || backendStatuses?.seurat?.status === pipelineStatus.SUCCEEDED),
    );
  }, [backendStatuses]);

  useEffect(() => {
    setAllSamplesAnalysed(getAllSamplesAnalysed());
  }, [activeExperiment, experimentSettings]);

  const getAllSamplesAnalysed = () => {
    // Returns true only if there is at least one sample in the currently active
    // project AND all samples in the project have been analysed.
    if (!activeExperiment?.sampleIds?.length) {
      return false;
    }
    const steps = Object.values(_.omit(experimentSettings?.processing, ['meta']));
    return steps.length > 0
      // eslint-disable-next-line no-prototype-builtins
      && activeExperiment?.sampleIds?.every((s) => steps[0].hasOwnProperty(s));
  };

  const downloadExperimentData = async (type) => {
    try {
      if (!activeExperimentId) throw new Error('No experimentId specified');
      if (!downloadTypes.has(type)) throw new Error('Invalid download type');

      setDownloadingProcessedSeurat(true);
      await dispatch(downloadProcessedMatrix(activeExperimentId));
      setDownloadingProcessedSeurat(false);
      setDropdownExpanded(false);
    } catch (e) {
      handleError(e, endUserMessages.ERROR_DOWNLOADING_DATA);
    }
  };

  const menuItems = [
    {
      key: 'download-processed-seurat',
      disabled: !pipelineHasRun || backendLoading,
      onClick: (e) => {
        e.domEvent.stopPropagation();
        downloadExperimentData('processed-matrix');
      },
      label: (
        <Tooltip
          title={
            pipelineHasRun
              ? 'With Data Processing filters and settings applied'
              : 'Launch analysis to process data'
          }
          placement='left'
        >
          <Space>
            Processed Seurat object (.rds)
            {downloadingProcessedSeurat && <ClipLoader size={20} color='#8f0b10' />}
          </Space>
        </Tooltip>
      ),
    },
    {
      key: 'download-processing-settings',
      disabled: !allSamplesAnalysed || backendLoading,
      onClick: () => {
        const config = _.omit(experimentSettings.processing, ['meta']);
        const filteredConfig = filterQCParameters(
          config, activeExperiment.sampleIds, samples,
        );
        const blob = exportQCParameters(filteredConfig);
        saveAs(blob, `${activeExperimentId.split('-')[0]}_settings.txt`);
      },
      label: (
        allSamplesAnalysed
          ? 'Data Processing settings (.txt)'
          : (
            <Tooltip title='One or more of your samples has yet to be analysed' placement='left'>
              Data Processing settings (.txt)
            </Tooltip>
          )
      ),
    },
  ];

  return (
    <Dropdown
      open={dropdownExpanded}
      onOpenChange={(visible) => setDropdownExpanded(visible)}
      trigger={['click']}
      menu={{
        items: menuItems,
        onClick: (e) => {
          if (e.key !== 'download-processed-seurat') setDropdownExpanded(false);
        },
      }}
      placement='bottomRight'
      disabled={
        experiments.ids.length === 0
        || activeExperiment.sampleIds.length === 0
      }
    >
      <Button>
        Download
      </Button>
    </Dropdown>

  );
};

export default React.memo(DownloadDataButton);
