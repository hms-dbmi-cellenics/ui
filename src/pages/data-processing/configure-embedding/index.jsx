import React from 'react';
import {
  PageHeader,
} from 'antd';
import EmbeddingPreview from './components/EmbeddingPreview';

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
          className='site-page-header'
          title='Embedding preview (default clusters)'
          subTitle='Powerful data exploration'
          style={{ width: '100%', paddingRight: '0px' }}
        />
        <EmbeddingPreview />
      </>
    );
  }
}

export default ProcessingViewPage;
