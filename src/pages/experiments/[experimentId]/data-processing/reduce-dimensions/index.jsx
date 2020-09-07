import React from 'react';
import {
  PageHeader, Collapse,
} from 'antd';
import DimensionalityReduction from './components/DimensionalityReduction/DimensionalityReduction';
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
          title='Reduce dimensions'
          extra={<FeedbackButton />}
        />

        <Collapse accordion defaultActiveKey={['1']}>
          <Panel
            header='Dimensionality Reduction'
            key='1'
          >
            <DimensionalityReduction />
          </Panel>
        </Collapse>
      </>
    );
  }
}

export default ProcessingViewPage;
