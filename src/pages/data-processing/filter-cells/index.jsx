import React from 'react';
import {
  PageHeader, Collapse, Switch, Tooltip,
} from 'antd';
import ReadAlignment from './components/ReadAlignment/ReadAlignment';
import CellSizeDistribution from './components/CellSizeDistribution/CellSizeDistribution';
import MitochondrialContent from './components/MitochondrialContent/MitochondrialContent';
import DoubletScores from './components/DoubletScores/DoubletScores';

const { Panel } = Collapse;

class ProcessingViewPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ReadAlignmentFiltering: true,
      cellSizeFiltering: true,
      MitochondrialFiltering: true,
      DoubletScoresFiltering: true,
    };
  }

  render() {
    const { ReadAlignmentFiltering, cellSizeFiltering, MitochondrialFiltering, DoubletScoresFiltering } = this.state;
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
                <Switch
                  defaultChecked
                  onChange={(checked, event) => {
                    event.stopPropagation();
                    this.setState({ cellSizeFiltering: checked });
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
                <Switch
                  defaultChecked
                  onChange={(checked, event) => {
                    event.stopPropagation();
                    this.setState({ MitochondrialFiltering: checked });
                  }}
                />
              </Tooltip>
            )}
            key='2'
          >
            <MitochondrialContent filtering={MitochondrialFiltering} />
          </Panel>
          <Panel
            header='Read Alignment'
            extra={(
              <Tooltip title='disable filter'>
                <Switch
                  defaultChecked
                  onChange={(checked, event) => {
                    event.stopPropagation();
                    this.setState({ ReadAlignmentFiltering: checked });
                  }}
                />
              </Tooltip>
            )}
            key='3'
          >
            <ReadAlignment filtering={ReadAlignmentFiltering} />
          </Panel>
          <Panel header='Classifier' key='4' />
          <Panel header='Number of genes vs number of UMIs' key='5' />
          <Panel
            header='Doublet Scores'
            extra={(
              <Tooltip title='disable filter'>
                <Switch
                  defaultChecked
                  onChange={(checked, event) => {
                    event.stopPropagation();
                    this.setState({ DoubletScoresFiltering: checked });
                  }}
                />
              </Tooltip>
            )}
            key='6'
          >
            <DoubletScores filtering={DoubletScoresFiltering} />
          </Panel>
        </Collapse>
      </>
    );
  }
}

export default ProcessingViewPage;
