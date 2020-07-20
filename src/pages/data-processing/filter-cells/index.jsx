import React from 'react';
import {
  PageHeader, Collapse
} from 'antd';
import CellSizeDistribution from './components/CellSizeDistribution/cellSizeDistribution'
const { Panel } = Collapse;

class ProcessingViewPage extends React.Component {


  render() {
    return (
      <>
        <PageHeader
          className='site-page-header'
          title='Data Processing'
          subTitle='Powerful data exploration'
          style={{ width: '100%', paddingRight: '0px' }}
        />

        <Collapse accordion>
          <Panel header='Cell size Distribution' key='1'>
            <CellSizeDistribution />
          </Panel>
          <Panel header='Mitochondrial content' key='2'>
          </Panel>
          <Panel header='Read alignment' key='3'>
          </Panel>
          <Panel header='Classifier' key='4'>
          </Panel>
          <Panel header='Number of genes vs number of UMIs' key='5'>
          </Panel>
          <Panel header='Doublet scores' key='6'>
          </Panel>
        </Collapse>
      </>
    );
  }
}

export default ProcessingViewPage;
