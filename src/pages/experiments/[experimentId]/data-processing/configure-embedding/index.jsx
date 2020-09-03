import React from 'react';
import {
  Collapse, PageHeader,
} from 'antd';
import EmbeddingPreview from './components/EmbeddingPreview';
import FeedbackButton from '../../../../../components/FeedbackButton';

const { Panel } = Collapse;
class ProcessingViewPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    return (
      <>
        <PageHeader
          title='Data Processing'
          extra={<FeedbackButton />}
        />
        <Collapse defaultActiveKey={['1']}>
          <Panel key='1' header='Configure Embedding'>
            <EmbeddingPreview />
          </Panel>
        </Collapse>
      </>
    );
  }
}

export default ProcessingViewPage;
