import React from 'react';
import _ from 'lodash';
import { Menu, Tooltip } from 'antd';
import PropTypes from 'prop-types';
import { saveAs } from 'file-saver';
import pipelineStatus from '../../utils/pipelineStatusValues';
import downloadData from '../../utils/data-management/downloadExperimentData';
import downloadTypes from '../../utils/data-management/downloadTypes';
import { exportQCParameters, filterQCParameters } from '../../utils/exportQCParameters';

const DownloadData = (props) => {
  const {
    activeProject, experiments, experimentSettings, samples, activeProjectUuid,
  } = props;

  const pipelineHasRun = (experimentId) => (
    experiments[experimentId]?.meta?.backendStatus?.pipeline?.status === pipelineStatus.SUCCEEDED
  );
  const gem2sHasRun = (experimentId) => (
    experiments[experimentId]?.meta?.backendStatus?.gem2s?.status === pipelineStatus.SUCCEEDED
  );

  const allSamplesAnalysed = () => {
    // Returns true only if there is at least one sample in the currently active
    // project AND all samples in the project have been analysed.
    const steps = Object.values(_.omit(experimentSettings?.processing, ['meta']));

    return steps.length > 0
      && activeProject?.samples?.length > 0
      && activeProject?.samples?.every((s) => steps[0].hasOwnProperty(s));
  };

  return (
    <Menu>
      <Menu.Item
        key='download-raw-seurat'
        disabled={activeProject?.experiments?.length
        && !gem2sHasRun(activeProject?.experiments[0])}
        onClick={() => {
          const experimentId = activeProject?.experiments[0];
          downloadData(experimentId, downloadTypes.RAW_SEURAT_OBJECT);
        }}
      >
        <Tooltip
          title={
          activeProject?.experiments?.length
            && gem2sHasRun(activeProject?.experiments[0])
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
        activeProject?.experiments?.length > 0
        && !pipelineHasRun(activeProject?.experiments[0])
        }
        onClick={() => {
        // Change if we have more than one experiment per project
          const experimentId = activeProject?.experiments[0];
          downloadData(experimentId, downloadTypes.PROCESSED_SEURAT_OBJECT);
        }}
      >
        <Tooltip
          title={
          activeProject?.experiments?.length > 0
            && pipelineHasRun(activeProject?.experiments[0])
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
  );
};

DownloadData.propTypes = {
  activeProject: PropTypes.object.isRequired,
  experiments: PropTypes.object.isRequired,
  experimentSettings: PropTypes.object.isRequired,
  samples: PropTypes.object.isRequired,
  activeProjectUuid: PropTypes.string.isRequired,
};
export default DownloadData;
