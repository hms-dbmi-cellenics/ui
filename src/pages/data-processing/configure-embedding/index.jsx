import React from 'react';
import {
  Collapse,
} from 'antd';
import EmbeddingPreview from './components/EmbeddingPreview';

const { Panel } = Collapse;
class ProcessingViewPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    return (
      <Collapse defaultActiveKey={['1']}>
        <Panel key='1' header='Configure Embedding'>
          <EmbeddingPreview />
        </Panel>
      </Collapse >
    );
  }
}

export default ProcessingViewPage;
