import React from 'react';
import {
  Result, Button,
} from 'antd';
import Link from 'next/link';
import PropTypes from 'prop-types';

const PipelineRunningEmptyState = ({ experimentId }) => {
  const path = '/experiments/[experimentId]/data-processing';

  return (
    <Result
      status='info'
      title='We are working on your project...'
      subTitle={(
        <>
          <span>This page will be unavaiable while we are processing your data.</span>
          <br />
          <span>You can check the progress we&apos;ve made in Data Processing or try again later.</span>
        </>
      )}

      icon={(
        <img
          width={250}
          height={250}
          alt='A woman fitting an oversized clipboard next to other clipboards (illustration).'
          src='/undraw_Timeline_re_aw6g.svg'
        />
      )}
      extra={(
        <Link as={path.replace('[experimentId]', experimentId)} href={path} passHref>
          <Button type='primary' key='console'>
            Go to Data Processing
          </Button>
        </Link>
      )}
    />
  );
};

PipelineRunningEmptyState.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default PipelineRunningEmptyState;
