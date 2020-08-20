import React from 'react';
import {
  PageHeader, Collapse,
} from 'antd';
import DimensionalityReduction from './components/DimensionalityReduction/DimensionalityReduction';

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
          className='site-page-header'
          title='Reduce dimensions'
          subTitle='Powerful data exploration'
          style={{ width: '100%', paddingRight: '0px' }}
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
