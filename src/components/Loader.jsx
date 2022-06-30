import React from 'react';
import PropTypes from 'prop-types';
import { ClipLoader, BounceLoader } from 'react-spinners';
import { Typography } from 'antd';
import useSWR from 'swr';

import fetchAPI from 'utils/http/fetchAPI';

const { Text } = Typography;

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

const Loader = ({ experimentId }) => {
  const { data: workerStatus } = useSWR(
    () => (experimentId ? `/v2/experiments/${experimentId}/backendStatus` : null),
    fetchAPI,
  );

  if (!workerStatus) {
    return (
      <div>
        {fastLoad()}
      </div>
    );
  }

  const { worker: { started, ready } } = workerStatus;
  if (started && ready) {
    return (
      <div>
        {fastLoad()}
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
