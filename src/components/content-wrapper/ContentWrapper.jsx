import React from 'react';
import {
  Layout, Menu,
} from 'antd';
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
      collapsed: true,
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
        <Sider
          width={300}
          theme='dark'
          collapsible
          collapsed={collapsed}
          onCollapse={this.onCollapse}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'space-between',
          }}
          >
            <Menu theme='dark' defaultSelectedKeys={['1']} mode='inline'>
              <Menu.Item disabled>
                <svg width='125px' height='45px' viewBox='0 0 1968 448'>
                  <g id='Page-1' stroke='none' strokeWidth='1' fill='none' fillRule='evenodd'>
                    <g id='Group'>
                      <g id='Product-logo' fill='#ffffff'>
                        <rect id='Rectangle' x='320' y='384' width='64' height='64' />
                        <rect id='Rectangle' x='0' y='0' width='192' height='64' />
                        <rect id='Rectangle' x='0' y='384' width='192' height='64' />
                        <rect id='Rectangle' x='64' y='64' width='64' height='320' />
                        <rect id='Rectangle' x='256' y='0' width='64' height='384' />
                        <rect id='Rectangle' x='384' y='0' width='64' height='384' />
                      </g>
                    </g>
                  </g>
                </svg>
              </Menu.Item>

              <Menu.Item disabled>
                <BarsOutlined />
                <span>TGFB-1 hyperplasia experiment</span>
              </Menu.Item>
              <Menu.Item key='1'>
                <HomeOutlined />
                <span>Home</span>
              </Menu.Item>
              <Menu.Item key='2'>
                <BuildOutlined />
                <span>Processing</span>
              </Menu.Item>
              <Menu.Item key='3'>
                <FundViewOutlined />
                <span>Data Exploration</span>
              </Menu.Item>
              <Menu.Item key='4'>
                <DatabaseOutlined />
                <span>Plots and tables</span>
              </Menu.Item>
              <Menu.Item key='5'>
                <SettingOutlined />
                <span>Settings</span>
              </Menu.Item>
            </Menu>
            <Menu
              theme='dark'
              mode='inline'
            />
          </div>
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
