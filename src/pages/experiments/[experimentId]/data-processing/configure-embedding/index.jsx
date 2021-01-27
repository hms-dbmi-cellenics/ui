import React from 'react';
import { useRouter } from 'next/router';
import {
  Collapse, PageHeader,
} from 'antd';
import useSWR from 'swr';
import Error from 'next/error';
import EmbeddingPreview from './components/EmbeddingPreview';
import FeedbackButton from '../../../../../components/FeedbackButton';
import getApiEndpoint from '../../../../../utils/apiEndpoint';
import { getFromApiExpectOK } from '../../../../../utils/cacheRequest';
import PreloadContent from '../../../../../components/PreloadContent';

const { Panel } = Collapse;

const ProcessingViewPage = () => {
  const router = useRouter();
  const { experimentId } = router.query;

  const { data, error } = useSWR(`${getApiEndpoint()}/v1/experiments/${experimentId}`, getFromApiExpectOK);

  if (error) {
    if (error.payload === undefined) {
      return <Error statusCode='You are not connected to the backend.' />;
    }
    const { status } = error.payload;
    return <Error statusCode={status} />;
  }

  if (!data) {
    return <PreloadContent />;
  }

  return (
    <>
      <PageHeader
        title='Data Processing'
        extra={<FeedbackButton />}
      />
      <Collapse defaultActiveKey={['1']}>
        <Panel key='1' header='Configure Embedding'>
          <EmbeddingPreview experimentId={experimentId} />
        </Panel>
      </Collapse>
    </>
  );
};

export default ProcessingViewPage;
