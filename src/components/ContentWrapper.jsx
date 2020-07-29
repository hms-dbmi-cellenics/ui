import React, { useState } from 'react';

import PropTypes from 'prop-types';

import {
  Layout, Menu,
} from 'antd';

import Link from 'next/link';
import {
  DatabaseOutlined,
  FundViewOutlined,
  BuildOutlined,
  BarsOutlined,
} from '@ant-design/icons';
import NotificationManager from './NotificationManager';

const { Sider } = Layout;

const ContentWrapper = (props) => {
  const [collapsed, setCollapsed] = useState(true);
  const { children } = props;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <NotificationManager />
      <Sider
        width={300}
        theme='dark'
        collapsible
        collapsed={collapsed}
        onCollapse={(collapse) => setCollapsed(collapse)}
      >
        <Menu theme='dark' defaultSelectedKeys={['3']} mode='inline'>
          <Menu.Item disabled key='0'>
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
          <Menu.Item disabled key='1'>
            <BarsOutlined />
            <span> PBMC Dataset Experiment</span>
          </Menu.Item>
          <Menu.Item key='2'>
            <BuildOutlined />
            <span>Data Processing</span>
          </Menu.Item>
          <Menu.Item key='3'>
            <Link href='/data-exploration' passHref>
              <div>
                <FundViewOutlined />
                <span>Data Exploration</span>
              </div>
            </Link>
          </Menu.Item>
          <Menu.Item key='4'>
            <Link href='/plots-and-tables' passHref>
              <div>
                <DatabaseOutlined />
                <span> Plots and Tables </span>
              </div>
            </Link>
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout>
        {children}
      </Layout>
    </Layout>
  );
};

ContentWrapper.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ContentWrapper;
