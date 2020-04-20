import React from 'react';

import {
  PageHeader, Row, Col, Input, Collapse, Space, Dropdown, Menu,
  Typography, Empty,
} from 'antd';

import { Scatterplot } from 'vitessce/es/production/scatterplot.min.js';
import CellSetsTool from './components/CellSetsTool';
import PlotList from './components/PlotList';
import CloseWindow from '../../components/CloseWindow';

import 'vitessce/es/production/static/css/index.css';

const { Text } = Typography;
const { Search } = Input;
const { Panel } = Collapse;

class ExplorationViewPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      openedTools: [],
      filteredTools: [],
    };

    this.availableTools = [
      {
        name: 'Cell set',
        description: 'Create and manage categories of cells.',
        key: '1',
        renderer: () => <CellSetsTool experimentID="5e959f9c9f4b120771249001" />,
      },
      {
        name: 'Gene set',
        description: 'Create and manage categories of genes.',
        key: '2',
        renderer: () => <CellSetsTool experimentID="5e959f9c9f4b120771249001" />,
      },
      {
        name: 'Differential expression (simple)',
        description: 'Find and explore the most characteristic genes in a set of cells.',
        key: '3',
        renderer: () => <CellSetsTool experimentID="5e959f9c9f4b120771249001" />,
      },
      {
        name: 'bobooo set',
        description: 'Everything is awesome!',
        key: '4',
        renderer: () => <CellSetsTool experimentID="5e959f9c9f4b120771249001" />,
      },
      {
        name: 'banana set',
        description: 'Create and manage categories of bananas.',
        key: '5',
        renderer: () => <CellSetsTool experimentID="5e959f9c9f4b120771249001" />,
      },
    ];

    this.plots = [{
      key: 'item-1',
      name: 'tSNE plot',
      renderer: () => {
        const uuid = 'my-scatterplot';
        const view = { target: [0, 0, 0], zoom: 0.75 };
        const cells = {
          1: {
            mappings: {
              PCA: [2, 1],
            },
          },
          2: {
            mappings: {
              PCA: [5, 1],
            },
          },
          3: {
            mappings: {
              PCA: [6.5, 4],
            },
          },
          4: {
            mappings: {
              PCA: [6, 4.5],
            },
          },
          5: {
            mappings: {
              PCA: [5.5, 5],
            },
          },
          6: {
            mappings: {
              PCA: [0.5, 4],
            },
          },
          7: {
            mappings: {
              PCA: [1, 4.5],
            },
          },
          8: {
            mappings: {
              PCA: [1.5, 5],
            },
          },
          9: {
            mappings: {
              PCA: [2, 5.25],
            },
          },
          10: {
            mappings: {
              PCA: [5, 5.25],
            },
          },
          11: {
            mappings: {
              PCA: [4.5, 5.35],
            },
          },
          12: {
            mappings: {
              PCA: [3.5, 5.45],
            },
          },
          13: {
            mappings: {
              PCA: [2.5, 5.35],
            },
          },
        };
        const cellColors = null;
        const mapping = 'PCA';
        const selectedCellIds = new Set();
        const updateCellsHover = (hoverInfo) => { };
        const updateCellsSelection = (selectedIds) => { };
        const updateStatus = (message) => { };
        const updateViewInfo = (viewInfo) => { };
        const clearPleaseWait = (layerName) => { };

        return (
          <div style={{ height: '50vh', position: 'relative' }}>
            <Scatterplot
              uuid={uuid}
              view={view}
              cells={cells}
              mapping={mapping}
              selectedCellIds={selectedCellIds}
              cellColors={cellColors}
              updateStatus={updateStatus}
              updateCellsSelection={updateCellsSelection}
              updateCellsHover={updateCellsHover}
              updateViewInfo={updateViewInfo}
              clearPleaseWait={clearPleaseWait}
            />
          </div>
        );
      },
    },
    {
      key: 'item-2',
      name: 'PCA plot',
      renderer: () => (<span>asdsa</span>),
    },
    {
      key: 'item-3',
      name: 'booboo plot',
      renderer: () => (<span>asdsa</span>),
    }];

    this.closeTool = this.closeTool.bind(this);
    this.openTool = this.openTool.bind(this);
    this.filterTools = this.filterTools.bind(this);
  }

  closeTool(key) {
    const { openedTools } = this.state;
    this.setState({ openedTools: openedTools.filter((obj) => obj.key !== key) });
  }

  openTool(key) {
    const { openedTools } = this.state;

    if (openedTools.find((obj) => obj.key === key)) {
      return;
    }

    const toolToRender = this.availableTools.find((obj) => obj.key === key);

    openedTools.unshift(toolToRender);

    this.setState({ openedTools });
  }

  filterTools(text) {
    let { filteredTools } = this.state;

    filteredTools = [];

    this.availableTools.forEach((tool) => {
      if (tool.name.toLowerCase().includes(text.toLowerCase())
        || tool.description.toLowerCase().includes(text.toLowerCase())) {
        filteredTools.push(tool);
      }
    });

    this.setState({ filteredTools });
  }

  renderMenu() {
    const { filteredTools: optionsToRender } = this.state;
    if (optionsToRender.length > 0) {
      return (
        <Menu>
          {
            optionsToRender.map((t) => this.renderMenuItem(t.name, t.description, t.key))
          }
        </Menu>
      );
    }
    return (
      <Menu>
        {
          this.availableTools.map((t) => this.renderMenuItem(t.name, t.description, t.key))
        }
      </Menu>
    );
  }

  renderToolbar() {
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
      <Collapse>
        {
          openedTools.map((tool) => (
            <Panel
              header={tool.name}
              key={tool.key}
              extra={<CloseWindow params={tool.key} action={this.closeTool} />}
            >
              {tool.renderer()}
            </Panel>
          ))
        }
      </Collapse>
    );
  }

  renderMenuItem(primaryText, secondaryText, key) {
    return (
      <Menu.Item
        key={key}
        onClick={() => {
          this.openTool(key);
        }}
      >
        <div>
          <Text strong>{primaryText}</Text>
          <br />
          <Text type="secondary">{secondaryText}</Text>
        </div>
      </Menu.Item>
    );
  }

  render() {
    const menu = this.renderMenu();

    return (
      <>
        <Row>
          <Col>
            <PageHeader
              className="site-page-header"
              title="Exploration"
            />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={16}>
            my url:
            {process.env.REACT_APP_API_URL}

            <PlotList plots={this.plots} />
          </Col>
          <Col span={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Dropdown
                overlay={menu}
                trigger={['click']}
              >
                <Search placeholder="Search or browse tools..." onChange={(e) => this.filterTools(e.target.value)} />
              </Dropdown>
              {this.renderToolbar()}
            </Space>
          </Col>
        </Row>
      </>
    );
  }
}

export default ExplorationViewPage;
