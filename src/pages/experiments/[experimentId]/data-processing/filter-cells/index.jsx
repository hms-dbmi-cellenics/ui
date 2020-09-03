import React from 'react';
import {
  PageHeader, Collapse, Switch, Tooltip,
} from 'antd';
import ReadAlignment from './components/ReadAlignment/ReadAlignment';
import CellSizeDistribution from './components/CellSizeDistribution/CellSizeDistribution';
import MitochondrialContent from './components/MitochondrialContent/MitochondrialContent';
import Classifier from './components/Classifier/Classifier';
import GenesVsUMIs from './components/GenesVsUMIs/GenesVsUMIs';
import DoubletScores from './components/DoubletScores/DoubletScores';
import FeedbackButton from '../../../../../components/FeedbackButton';

const { Panel } = Collapse;

class ProcessingViewPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ReadAlignmentFiltering: true,
      cellSizeFiltering: true,
      MitochondrialFiltering: true,
      ClassifierFiltering: true,
      GeneVUmiFiltering: true,
      DoubletScoresFiltering: true,
    };
  }

  render() {
    const {
      cellSizeFiltering, MitochondrialFiltering,
      ClassifierFiltering, GeneVUmiFiltering, DoubletScoresFiltering, ReadAlignmentFiltering,
    } = this.state;
    return (
      <>
        <PageHeader
          title='Data Processing'
          extra={<FeedbackButton />}
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
            header='Read alignment'
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
          <Panel
            header='Classifier'
            extra={(
              <Tooltip title='disable filter'>
                <Switch
                  defaultChecked
                  onChange={(checked, event) => {
                    event.stopPropagation();
                    this.setState({ ClassifierFiltering: checked });
                  }}
                />
              </Tooltip>
            )}
            key='4'
          >
            <Classifier filtering={ClassifierFiltering} />
          </Panel>
          <Panel
            header='Number of genes vs number of UMIs'
            key='5'
            extra={(
              <Tooltip title='disable filter'>
                <Switch
                  defaultChecked
                  onChange={(checked, event) => {
                    event.stopPropagation();
                    this.setState({ GeneVUmiFiltering: checked });
                  }}
                />
              </Tooltip>
            )}
          >
            <GenesVsUMIs filtering={GeneVUmiFiltering} />
          </Panel>
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
