import React from 'react';
import { Result, Button, Typography } from 'antd';

import FeedbackButton from '../components/FeedbackButton';

const { Title } = Typography;

export default function Custom404() {
  return (
    <Result
      title={<Title level={2}>Oops</Title>}
      icon={(
        <img
          alt='People looking into bushes to find something (illustration).'
          src='/undraw_not_found_60pq.svg'
          width={250}
          height={250}
        />
      )}
      subTitle={(
        <Title
          level={4}
          style={{ fontWeight: 'normal' }}
        >
          We can&apos;t seem to find the page you&apos;re looking for.
        </Title>
      )}
      extra={(
        <>
          <Button type='primary' href='/'>
            Go home
          </Button>
          <FeedbackButton />
        </>
      )}
    />
  );
}
