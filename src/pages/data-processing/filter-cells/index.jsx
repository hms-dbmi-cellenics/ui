import React from 'react';
import {
  PageHeader, Collapse, Switch, Tooltip,
} from 'antd';
import CellSizeDistribution from './components/CellSizeDistribution/CellSizeDistribution';
import MitochondrialContent from './components/MitochondrialContent/MitochondrialContent';

const { Panel } = Collapse;

class ProcessingViewPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cellSizeFiltering: true,
      MitochondrialFiltering: true,
    };
  }

  render() {
    const { cellSizeFiltering, MitochondrialFiltering } = this.state;
    return (
      <>
        <PageHeader
          className='site-page-header'
          title='Data Processing'
          subTitle='Powerful data exploration'
          style={{ width: '100%', paddingRight: '0px' }}
        />

        <Collapse accordion>
          <Panel
            header='Cell size Distribution'
            extra={(
              <Tooltip title='disable filter'>
                <Switch defaultChecked onChange={(checked, event) => {
                  event.stopPropagation();
                  this.setState({ cellSizeFiltering: checked })
                }}
                />
              </Tooltip>
            )}
            key='1'
          >
            <CellSizeDistribution filtering={cellSizeFiltering} />
          </Panel>
          <Panel
            header='Mitochondrial content'
            extra={(
              <Tooltip title='disable filter'>
                <Switch defaultChecked onChange={(checked, event) => {
                  event.stopPropagation();
                  this.setState({ MitochondrialFiltering: checked })
                }}
                />
              </Tooltip>
            )}
            key='2'
          >
            <MitochondrialContent filtering={MitochondrialFiltering} />
          </Panel>
          <Panel header='Read alignment' key='3' />
          <Panel header='Classifier' key='4' />
          <Panel header='Number of genes vs number of UMIs' key='5' />
          <Panel header='Doublet scores' key='6' />
        </Collapse>
      </>
    );
  }
}

export default ProcessingViewPage;
