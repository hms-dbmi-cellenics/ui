/* eslint-disable import/no-unresolved */
import React, { useEffect } from 'react';
import _ from 'lodash';
import {
  Menu, Tooltip, Dropdown, Button,
} from 'antd';

import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { saveAs } from 'file-saver';
import downloadTypes from 'utils/data-management/downloadTypes';
import { getFromApiExpectOK } from 'utils/getDataExpectOK';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import endUserMessages from 'utils/endUserMessages';
import pipelineStatus from '../../utils/pipelineStatusValues';
import { exportQCParameters, filterQCParameters } from '../../utils/data-management/exportQCParameters';
import { loadBackendStatus } from '../../redux/actions/backendStatus/index';

const DownloadData = (props) => {
  const {
    activeProjectUuid,
  } = props;
  const dispatch = useDispatch();
  const activeProject = useSelector((state) => state.projects[activeProjectUuid]);
  const experimentSettings = useSelector((state) => state.experimentSettings);
  const backendStatus = useSelector((state) => state.backendStatus);
  const samples = useSelector((state) => state.samples);
  const projects = useSelector((state) => state.projects);
  const experimentId = activeProject?.experiments[0];

  useEffect(() => {
    if (activeProject?.experiments?.length) {
      dispatch(loadBackendStatus(activeProject?.experiments[0]));
    }
  }, [activeProject]);

  const pipelineHasRun = () => (
    (backendStatus[experimentId]?.status.pipeline?.status === pipelineStatus.SUCCEEDED)
    && experimentId
  );
  const gem2sHasRun = () => (
    (backendStatus[experimentId]?.status?.gem2s?.status === pipelineStatus.SUCCEEDED)
   && experimentId
  );

  const allSamplesAnalysed = () => {
    // Returns true only if there is at least one sample in the currently active
    // project AND all samples in the project have been analysed.
    if (!activeProject?.samples?.length) {
      return false;
    }
    const steps = Object.values(_.omit(experimentSettings?.processing, ['meta']));

    return steps.length > 0
      && activeProject?.samples?.every((s) => steps[0].hasOwnProperty(s));
  };

  const downloadExperimentData = async (type) => {
    try {
      if (!experimentId) throw new Error('No experimentId specified');
      if (!Object.values(downloadTypes).includes(type)) throw new Error('Invalid download type');

      const { signedUrl } = await getFromApiExpectOK(`/v1/experiments/${experimentId}/download/${type}`);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = signedUrl;

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        URL.revokeObjectURL(link.href);
        link.parentNode.removeChild(link);
      }, 0);
    } catch (e) {
      pushNotificationMessage('error', endUserMessages.ERROR_DOWNLOADING_DATA);
    }
  };

  return (
    <Dropdown
      overlay={() => (
        <Menu>
          <Menu.Item
            key='download-raw-seurat'
            disabled={!gem2sHasRun()}
            onClick={() => {
              downloadExperimentData(downloadTypes.RAW_SEURAT_OBJECT);
            }}
          >
            <Tooltip
              title={
                gem2sHasRun()
                  ? 'Samples have been merged'
                  : 'Launch analysis to merge samples'
              }
              placement='left'
            >
              Raw Seurat object (.rds)
            </Tooltip>
          </Menu.Item>
          <Menu.Item
            key='download-processed-seurat'
            disabled={
              !pipelineHasRun()
            }
            onClick={() => {
              // Change if we have more than one experiment per project
              downloadExperimentData(downloadTypes.PROCESSED_SEURAT_OBJECT);
            }}
          >
            <Tooltip
              title={
                pipelineHasRun(activeProject?.experiments[0])
                  ? 'With Data Processing filters and settings applied'
                  : 'Launch analysis to process data'
              }
              placement='left'
            >
              Processed Seurat object (.rds)
            </Tooltip>
          </Menu.Item>
          <Menu.Item
            disabled={!allSamplesAnalysed()}
            key='download-processing-settings'
            onClick={() => {
              const config = _.omit(experimentSettings.processing, ['meta']);
              const filteredConfig = filterQCParameters(config, activeProject.samples, samples);
              const blob = exportQCParameters(filteredConfig);
              saveAs(blob, `${activeProjectUuid.split('-')[0]}_settings.txt`);
            }}
          >
            {
              allSamplesAnalysed()
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
        projects.ids.length === 0
            || activeProject?.samples?.length === 0
      }
    >
      <Button>
        Download
      </Button>
    </Dropdown>

  );
};

DownloadData.propTypes = {
  activeProjectUuid: PropTypes.string.isRequired,
};
export default React.memo(DownloadData);
