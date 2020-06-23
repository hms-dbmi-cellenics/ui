import React from 'react';

import {
  PageHeader, Row, Col, Space, Empty,
} from 'antd';

import CellSetsTool from './components/cell-sets-tool/CellSetsTool';
import GeneListTool from './components/gene-list-tool/GeneListTool';
import DiffExprManager from './components/differential-expression-tool/DiffExprManager';
import DraggableList from '../../components/draggable-list/DraggableList';

import Embedding from './components/embedding/Embedding';
import HeatmapPlot from './components/heatmap/HeatmapPlot';
import InfoPanel from './components/info-panel/InfoPanel';
import SearchMenu from '../../components/search-menu/SearchMenu';

class ExplorationViewPage extends React.Component {
  constructor(props) {
    super(props);

    const experimentId = '5e959f9c9f4b120771249001';
    this.tools = [
      {
        name: 'Cell set',
        description: 'Create and manage interesting groupings of cells.',
        key: '1',
        renderer: () => <CellSetsTool experimentID={experimentId} />,
      },
      {
        name: 'Gene set',
        description: 'Find, organize, and annotate genes in your data set.',
        key: '2',
        renderer: () => <GeneListTool experimentID={experimentId} />,
      },
      {
        name: 'Differential expression (simple)',
        description: 'Find and explore the most characteristic genes in a set of cells.',
        key: '3',
        renderer: () => <DiffExprManager experimentID={experimentId} view='compute' />,
      },
    ];

    this.plots = [{
      key: 'item-1',
      name: 'UMAP Embedding',
      description: 'Visualize cells clustered by genetic expression using a UMAP embedding.',
      renderer: () => <Embedding experimentID={experimentId} embeddingType='umap' />,
    },
    {
      key: 'item-2',
      name: 'Heatmaps',
      description: 'Gain a high-level understanding of expression levels across large groups of genes and cells.',
      renderer: () => <HeatmapPlot />,
    },
    {
      key: 'item-3',
      name: 'Cell Info',
      description: 'A Panel to display information about the selected cell',
      renderer: () => <InfoPanel />,
    }];

    this.state = {
      openedTools: [this.tools[0]],
      openedPlots: [this.plots[2], this.plots[0]],
    };

    this.openTool = this.openTool.bind(this);
  }

  openTool(key) {
    const { openedTools } = this.state;

    if (openedTools.find((obj) => obj.key === key)) {
      return;
    }

    const toolToRender = this.tools.find((obj) => obj.key === key);

    openedTools.unshift(toolToRender);

    this.setState({ openedTools });
  }

  openPlot(key) {
    const { openedPlots } = this.state;

    if (openedPlots.find((obj) => obj.key === key)) {
      return;
    }

    const plotToRender = this.plots.find((obj) => obj.key === key);
    openedPlots.unshift(plotToRender);
    this.setState({ openedPlots });
  }

  renderTools() {
    const { openedTools } = this.state;

    if (openedTools.length === 0) {
      return (
        <Empty
          description={(
            <span>
              You aren&apos;t using any tools yet.
            </span>
          )}
        />
      );
    }

    return (
      <DraggableList
        plots={openedTools}
        onChange={(newList) => this.setState({ openedTools: newList })}
      />
    );
  }

  renderPlots() {
    const { openedPlots } = this.state;
    let { plots } = this;

    if (openedPlots.length > 0) {
      plots = openedPlots;
    }

    return (
      <DraggableList
        plots={plots}
        onChange={(newList) => this.setState({ openedPlots: newList })}
      />
    );
  }

  render() {
    const searchMenuTools = (
      <SearchMenu
        options={this.tools}
        onSelect={(key) => {
          this.openTool(key);
        }}
        placeholder='Add tool'
      />
    );

    const searchMenuPlots = (
      <SearchMenu
        options={this.plots}
        onSelect={(key) => {
          this.openPlot(key);
        }}
        placeholder='Add plot'
      />
    );

    return (
      <>
        <Row>
          <Col>
            <PageHeader
              className='site-page-header'
              title='Investigator'
              subTitle='Powerful data exploration'
            />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={15}>
            <Space direction='vertical' style={{ width: '100%' }}>
              {searchMenuPlots}
              {this.renderPlots()}
            </Space>
          </Col>
          <Col span={9}>
            <Space direction='vertical' style={{ width: '100%' }}>
              {searchMenuTools}
              {this.renderTools()}
            </Space>
          </Col>
        </Row>
      </>
    );
  }
}

export default ExplorationViewPage;
