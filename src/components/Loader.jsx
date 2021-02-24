import React from 'react';
import PropTypes from 'prop-types';
import { ClipLoader, BounceLoader } from 'react-spinners';
import { Typography } from 'antd';
import useSWR from 'swr';

import getFromApiExpectOK from '../utils/getFromApiExpectOK';
import getApiEndpoint from '../utils/apiEndpoint';

const { Text } = Typography;

const Loader = ({ experimentId }) => {
  const { data: workerStatus, error } = useSWR(
    () => (experimentId ? `${getApiEndpoint()}/v1/experiments/${experimentId}/pipelines` : null),
    getFromApiExpectOK,
  );

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
          This will take a bit longer...
        </Text>
      </p>
      <p>
        <Text type='secondary'>
          We&apos;re setting up your analysis after a period of inactivity.
        </Text>
      </p>
    </>
  );

  const fastLoad = () => (
    <>
      <div style={{ padding: 25 }}>
        <ClipLoader
          size={50}
          color='#8f0b10'
        />
      </div>
      <p>
        <Text>
          We&apos;re getting your data...
        </Text>
      </p>
    </>
  );

  if (!workerStatus || error) {
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
