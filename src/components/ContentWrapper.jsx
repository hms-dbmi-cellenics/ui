/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState } from 'react';

import PropTypes from 'prop-types';

import {
  Layout, Menu,
} from 'antd';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  DatabaseOutlined,
  FundViewOutlined,
  BuildOutlined,
  BarsOutlined,
} from '@ant-design/icons';
import NotificationManager from './notification/NotificationManager';

const { SubMenu } = Menu;
const { Sider } = Layout;

const ContentWrapper = (props) => {
  const [collapsed, setCollapsed] = useState(true);
  const { children } = props;
  const router = useRouter();
  const { experimentId } = router.query;

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
            <span>Experiment Name</span>
          </Menu.Item>
          <SubMenu key='sub1' icon={<BuildOutlined />} title='Data Processing'>
            <Menu.Item key='5'>
              <Link as={`/experiments/${experimentId}/data-processing/filter-cells`} href='/experiments/[experimentId]/data-processing/filter-cells' passHref>
                <div>
                  <BuildOutlined />
                  <span>Filter Cells</span>
                </div>
              </Link>
            </Menu.Item>
            <Menu.Item key='6'>
              <Link as={`/experiments/${experimentId}/data-processing/data-integration`} href='/experiments/[experimentId]/data-processing/data-integration' passHref>
                <div>
                  <span>Data Integration</span>
                </div>
              </Link>
            </Menu.Item>
            <Menu.Item key='7'>
              <Link as={`/experiments/${experimentId}/data-processing/configure-embedding`} href='/experiments/[experimentId]/data-processing/configure-embedding' passHref>
                <div>
                  <span>Configure Embedding</span>
                </div>
              </Link>
            </Menu.Item>
          </SubMenu>
          <Menu.Item key='3' icon={<FundViewOutlined />}>
            <Link as={`/experiments/${experimentId}/data-exploration`} href='/experiments/[experimentId]/data-exploration' passHref>
              <a>Data Exploration</a>
            </Link>
          </Menu.Item>
          <Menu.Item key='4' icon={<DatabaseOutlined />}>
            <Link as={`/experiments/${experimentId}/plots-and-tables`} href='/experiments/[experimentId]/plots-and-tables' passHref>
              <a>Plots and Tables</a>
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
