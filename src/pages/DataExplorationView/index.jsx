import React from 'react';

import {
  PageHeader, Row, Col, Input, Collapse, Space, Dropdown, Menu,
  Typography, Empty,
} from 'antd';

import {
  CloseOutlined,
} from '@ant-design/icons';

import CellSetsTool from './components/CellSetsTool';
import DraggableGrid from './components/DraggableGrid';
import Scatterplot from './components/scatterplot/Scatterplot';
import MyFancyMap from './components/scatterplot/MyFancyMap';

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

    this.closeTool = this.closeTool.bind(this);
    this.openTool = this.openTool.bind(this);
    this.filterTools = this.filterTools.bind(this);
  }

  getCloser(key) {
    return (
      <CloseOutlined
        onClick={(event) => {
          this.closeTool(key);
          event.stopPropagation();
        }}
      />
    );
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
            <Panel header={tool.name} key={tool.key} extra={this.getCloser(tool.key)}>
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
        <Row>
          <Col span={16}>
            <Scatterplot />
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
