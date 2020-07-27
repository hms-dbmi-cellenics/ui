import React from 'react';
import {
  PageHeader, Collapse, Switch
} from 'antd';
import CellSizeDistribution from './components/CellSizeDistribution/CellSizeDistribution'

const { Panel } = Collapse;

class ProcessingViewPage extends React.Component {
  state = {
    filtering1: false
  }

  render() {
    const disableFiltering = (e) => {
      this.setState({ filtering1: !this.state.filtering1 })
    }
    return (
      <>
        <PageHeader
          className='site-page-header'
          title='Data Processing'
          subTitle='Powerful data exploration'
          style={{ width: '100%', paddingRight: '0px' }}
        />

        <Collapse accordion>
          <Panel header='Cell size Distribution' extra={<Switch defaultChecked onChange={disableFiltering} />} key='1'>
            <CellSizeDistribution filtering={this.state.filtering1} />
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
