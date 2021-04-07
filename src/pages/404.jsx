import React from 'react';
import { Result, Button, Typography } from 'antd';

import FeedbackButton from '../components/FeedbackButton';

const { Title } = Typography;

const NotFoundPage = () => (
  <Result
    title={<Title level={2}>Page not found</Title>}
    icon={(
      <img
        alt='People looking into bushes to find something (illustration).'
        src='/undraw_not_found_60pq.svg'
        width={250}
        height={250}
        style={{
          display: 'block', marginLeft: 'auto', marginRight: 'auto', width: '50%',
        }}
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

export default NotFoundPage;
