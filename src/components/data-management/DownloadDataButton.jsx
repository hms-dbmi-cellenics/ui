import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import {
  Menu, Tooltip, Dropdown, Button,
} from 'antd';

import { useSelector, useDispatch } from 'react-redux';
import { saveAs } from 'file-saver';

import downloadTypes from 'utils/data-management/downloadTypes';
import fetchAPI from 'utils/http/fetchAPI';
import endUserMessages from 'utils/endUserMessages';
import downloadFromUrl from 'utils/downloadFromUrl';
import pipelineStatus from 'utils/pipelineStatusValues';
import { exportQCParameters, filterQCParameters } from 'utils/data-management/exportQCParameters';

import { loadBackendStatus } from 'redux/actions/backendStatus/index';

import { getBackendStatus } from 'redux/selectors';
import handleError from 'utils/http/handleError';

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
  const [qcHasRun, setQcHasRun] = useState(false);
  const [gem2sHasRun, setGem2sHasRun] = useState(false);
  const [allSamplesAnalysed, setAllSamplesAnalysed] = useState(false);

  useEffect(() => {
    if (activeExperimentId && !backendLoading && !backendStatuses) {
      dispatch(loadBackendStatus(activeExperimentId));
    }
  }, [activeExperimentId]);

  useEffect(() => {
    setQcHasRun(
      activeExperimentId && (backendStatuses?.pipeline?.status === pipelineStatus.SUCCEEDED),
    );
    setGem2sHasRun(
      activeExperimentId && (backendStatuses?.gem2s?.status === pipelineStatus.SUCCEEDED),
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

      const signedUrl = await fetchAPI(`/v2/experiments/${activeExperimentId}/download/${type}`);

      downloadFromUrl(signedUrl);
    } catch (e) {
      handleError(e, endUserMessages.ERROR_DOWNLOADING_DATA);
    }
  };

  return (
    <Dropdown
      overlay={() => (
        <Menu>
          <Menu.Item
            key='download-processed-seurat'
            disabled={!qcHasRun || backendLoading}
            onClick={() => {
              downloadExperimentData('processed-matrix');
            }}
          >
            <Tooltip
              title={
                qcHasRun
                  ? 'With Data Processing filters and settings applied'
                  : 'Launch analysis to process data'
              }
              placement='left'
            >
              Processed Seurat object (.rds)
            </Tooltip>
          </Menu.Item>
          <Menu.Item
            disabled={!allSamplesAnalysed || backendLoading}
            key='download-processing-settings'
            onClick={() => {
              const config = _.omit(experimentSettings.processing, ['meta']);
              const filteredConfig = filterQCParameters(config, activeExperiment.sampleIds, samples);
              const blob = exportQCParameters(filteredConfig);
              saveAs(blob, `${activeExperimentId.split('-')[0]}_settings.txt`);
            }}
          >
            {
              allSamplesAnalysed
                ? 'Data Processing settings (.txt)'
                : (
                  <Tooltip title='One or more of your samples has yet to be analysed' placement='left'>
                    Data Processing settings (.txt)
                  </Tooltip>
                )
            }
          </Menu.Item>
        </Menu>
      )}
      trigger={['click']}
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
