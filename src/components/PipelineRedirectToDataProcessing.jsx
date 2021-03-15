import React from 'react';
import {
  Result, Button,
} from 'antd';
import Link from 'next/link';
import PropTypes from 'prop-types';

const PipelineRedirectToDataProcessing = ({ experimentId, pipelineStatus }) => {
  const path = '/experiments/[experimentId]/data-processing';

  const texts = {
    error: {
      status: 'error',
      title: 'We\'ve had an issue while working on your project.',
      subTitle: 'Please try again in Data Processing.',
    },
    running: {
      status: 'info',
      title: 'We\'re working on your project...',
      subTitle: 'You can check the progress we\'ve made in Data Processing or try again later.',
    },
  };

  const { status, title, subTitle } = texts[pipelineStatus];

  return (
    <Result
      status={status}
      title={title}
      subTitle={subTitle}
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

PipelineRedirectToDataProcessing.propTypes = {
  experimentId: PropTypes.string.isRequired,
  pipelineStatus: PropTypes.oneOf(['error', 'running']).isRequired,
};

export default PipelineRedirectToDataProcessing;
