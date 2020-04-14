/* eslint-disable react/prop-types */
import React from 'react';

import { Layout, Menu } from 'antd';

import {
  HomeOutlined,
  SettingOutlined,
  DatabaseOutlined,
  FundViewOutlined,
  BuildOutlined,
  BarsOutlined,
} from '@ant-design/icons';

const { Content, Sider } = Layout;


class ContentWrapper extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      collapsed: false,
    };

    this.onCollapse = this.onCollapse.bind(this);
  }

  onCollapse(collapsed) {
    this.setState({ collapsed });
  }

  render() {
    const { collapsed } = this.state;
    const { children } = this.props;

    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Sider width={300} theme="light" collapsible collapsed={collapsed} onCollapse={this.onCollapse}>
          <Menu theme="light" defaultSelectedKeys={['1']} mode="inline">
            <Menu.Item disabled>
              <BarsOutlined />
              <span>TGFB-1 hyperplasia experiment</span>
            </Menu.Item>
            <Menu.Item key="1">
              <HomeOutlined />
              <span>Home</span>
            </Menu.Item>
            <Menu.Item key="2">
              <BuildOutlined />
              <span>Processing</span>
            </Menu.Item>
            <Menu.Item key="3">
              <FundViewOutlined />
              <span>Data Exploration</span>
            </Menu.Item>
            <Menu.Item key="4">
              <DatabaseOutlined />
              <span>Plots and tables</span>
            </Menu.Item>
            <Menu.Item key="5">
              <SettingOutlined />
              <span>Settings</span>
            </Menu.Item>

          </Menu>
        </Sider>
        <Layout>
          <Content style={{ margin: '8px 32px' }}>
            {children}
          </Content>
        </Layout>
      </Layout>
    );
  }
}

export default ContentWrapper;
