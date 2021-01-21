import React from 'react';
import { useRouter } from 'next/router';
import {
  Collapse, PageHeader,
} from 'antd';
import EmbeddingPreview from './components/EmbeddingPreview';
import FeedbackButton from '../../../../../components/FeedbackButton';

const { Panel } = Collapse;

const ProcessingViewPage = () => {
  const router = useRouter();
  const { experimentId } = router.query;

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
