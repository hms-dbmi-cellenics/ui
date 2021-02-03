import React from 'react';
import {
  PageHeader, Collapse,
} from 'antd';
import DataIntegration from './components/DataIntegration';
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
          title='Data Processing -> Data Integration'
          extra={<FeedbackButton />}
        />

        <Collapse accordion defaultActiveKey={['1']}>
          <Panel
            header='Dimensionality Reduction'
            key='1'
          >
            <DataIntegration />
          </Panel>
        </Collapse>
      </>
    );
  }
}

export default ProcessingViewPage;
