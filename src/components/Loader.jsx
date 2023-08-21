import PropTypes from 'prop-types';
import { ClipLoader, BounceLoader } from 'react-spinners';
import { Typography } from 'antd';
import useSWR from 'swr';
import React from 'react';
import { useSelector } from 'react-redux';
import fetchAPI from 'utils/http/fetchAPI';

const { Text } = Typography;
const DOWNLOAD_EXPERIMENT = 'download_experiment_s3';
const LOAD_EXPERIMENT = 'load_experiment_to_memory';
const STARTED_TASK = 'started_task';
const COMPRESSING_TASK_DATA = 'compressing_data';
const UPLOADING_TASK_DATA = 'upload_data';
const FINISHED_TASK = 'finished_task';
const slowLoad = () => (
  <>
    <div style={{ padding: 25 }}>
      <center>
        <BounceLoader
          size={50}
          color='#8f0b10'
          css={{ display: 'block' }}
        />
      </center>
    </div>
    <p>
      <Text>
        This will take a few minutes...
      </Text>
    </p>
    <p>
      <Text type='secondary'>
        We&apos;re setting up your analysis after a period of inactivity. Please wait.
      </Text>
    </p>
  </>
);

const fastLoad = (message) => (
  <>
    <div style={{ padding: 25 }}>
      <ClipLoader
        size={50}
        color='#8f0b10'
      />
    </div>
    <p>
      <Text>
        {message || "We're getting your data ..."}
      </Text>
    </p>
  </>
);

const formatTaskName = (taskName) => {
  // Remove "get" from the name
  const nameWithoutGet = taskName.replace(/Get/g, '');

  // Split on capital letters, then join with spaces
  const finalName = nameWithoutGet.replace(/([A-Z])/g, ' $1').trim();

  return finalName;
};

const formatInfo = (workingOn, request) => {
  if (workingOn === DOWNLOAD_EXPERIMENT || workingOn === LOAD_EXPERIMENT) {
    return 'Accessing the Seurat object for your analysis';
  }
  if (workingOn === STARTED_TASK) {
    return `Working on the requested task: ${formatTaskName(request.body.name)}`;
  }
  if (workingOn === COMPRESSING_TASK_DATA) {
    return `Working on the requested task:${formatTaskName(request.body.name)}`;
  }
  if (workingOn === UPLOADING_TASK_DATA) {
    return `Finalizing results for the requested task: ${formatTaskName(request.body.name)}`;
  }
  if (workingOn === FINISHED_TASK) {
    return `Displaying results for the requested task: ${formatTaskName(request.body.name)}`;
  }
  return workingOn;
};

const Loader = ({ experimentId }) => {
  const backendStatus = useSelector((state) => state.backendStatus);
  const workerInfo = backendStatus?.[experimentId]?.status?.worker;

  const { data: workerStatus } = useSWR(
    () => (experimentId ? `/v2/experiments/${experimentId}/backendStatus` : null),
    fetchAPI,
  );

  if (!workerStatus) {
    return (
      <div>
        {fastLoad('Assigning a worker to your analysis')}
      </div>
    );
  }

  if (workerInfo && workerInfo.workingOn) {
    console.log('workerInfo: ', workerInfo);
    const { workingOn, request } = workerInfo;
    const message = formatInfo(workingOn, request);
    return (
      <div>
        {fastLoad(message)}
      </div>
    );
  }

  const { worker: { started, ready } } = workerStatus;
  if (started && ready) {
    return (
      <div>
        {fastLoad('Assigning a worker to your analysis')}
      </div>
    );
  }

  return (
    <div>
      {slowLoad()}
    </div>
  );
};

Loader.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default Loader;
export { fastLoad, slowLoad };
