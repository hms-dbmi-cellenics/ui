/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState } from 'react';

import PropTypes from 'prop-types';

import {
  Layout, Menu, Typography,
} from 'antd';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  DatabaseOutlined,
  FundViewOutlined,
  BuildOutlined,
} from '@ant-design/icons';
import NotificationManager from './notification/NotificationManager';

const { SubMenu } = Menu;
const { Sider, Footer, Header } = Layout;
const { Paragraph } = Typography;

const ContentWrapper = (props) => {
  const [collapsed, setCollapsed] = useState(true);
  const { children } = props;
  const router = useRouter();
  const { experimentId } = router.query;

  const BigLogo = () => (
    <div
      style={{
        background: 'linear-gradient(315deg, #5B070A 0%, #8f0b10 30%, #A80D12 100%)',
        paddingLeft: '32px',
        paddingTop: '8px',
        paddingBottom: '8px',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <svg xmlns='http://www.w3.org/2000/svg' width={110} height={50}>
        <defs id='svg_document_defs'>
          <style id='IBM Plex Sans_Google_Webfont_import'>@import url(https://fonts.googleapis.com/css?family=IBM+Plex+Sans);</style>
        </defs>
        <g>
          <text
            style={{ outlineStyle: 'none' }}
            x='1px'
            fontWeight='500'
            textRendering='geometricPrecision'
            fontFamily='IBM Plex Sans'
            y='25px'
            fill='#F0F2F5'
            fontSize='25.00px'
            textAnchor='start'
          >
            Cellscope
          </text>
          <text
            stroke='none'
            style={{ outlineStyle: 'none' }}
            strokeWidth='1px'
            x='3px'
            fontWeight='200'
            textRendering='geometricPrecision'
            fontFamily='IBM Plex Sans'
            fill='#aab6c1'
            fontSize='12.80px'
            y='45px'
            textAnchor='start'
          >
            by Biomage
          </text>
        </g>
      </svg>
    </div>
  );

  const SmallLogo = () => (
    <div
      style={{
        background: 'linear-gradient(315deg, #5B070A 0%, #8f0b10 30%, #A80D12 100%)',
        paddingTop: '8px',
        paddingBottom: '8px',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <svg xmlns='http://www.w3.org/2000/svg' width={100} height={50}>
        <defs id='svg_document_defs'>
          <style id='IBM Plex Sans_Google_Webfont_import'>@import url(https://fonts.googleapis.com/css?family=IBM+Plex+Sans);</style>
        </defs>
        <g>
          <text
            style={{ outlineStyle: 'none' }}
            x='40px'
            fontWeight='500'
            textRendering='geometricPrecision'
            fontFamily='IBM Plex Sans'
            y='24px'
            fill='#F0F2F5'
            fontSize='25.00px'
            textAnchor='middle'
          >
            Cs
          </text>
          <text
            stroke='none'
            style={{ outlineStyle: 'none' }}
            strokeWidth='1px'
            x='40px'
            fontWeight='200'
            textRendering='geometricPrecision'
            fontFamily='IBM Plex Sans'
            fill='#aab6c1'
            fontSize='12.80px'
            y='45px'
            textAnchor='middle'
          >
            Biomage
          </text>
        </g>
      </svg>
    </div>
  );

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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {!collapsed && <BigLogo />}
          {collapsed && <SmallLogo />}
          <Menu theme='dark' defaultSelectedKeys={['data-exploration']} mode='inline'>
            <Menu.Item key='data-processing' icon={<BuildOutlined />}>
              <Link as={`/experiments/${experimentId}/data-processing`} href='/experiments/[experimentId]/data-processing' passHref>
                <a>Data Processing</a>
              </Link>
            </Menu.Item>

            <Menu.Item key='data-exploration' icon={<FundViewOutlined />}>
              <Link as={`/experiments/${experimentId}/data-exploration`} href='/experiments/[experimentId]/data-exploration' passHref>
                <a>Data Exploration</a>
              </Link>
            </Menu.Item>
            <Menu.Item key='plots-and-tables' icon={<DatabaseOutlined />}>
              <Link as={`/experiments/${experimentId}/plots-and-tables`} href='/experiments/[experimentId]/plots-and-tables' passHref>
                <a>Plots and Tables</a>
              </Link>
            </Menu.Item>
          </Menu>
          {!collapsed && (
            <Footer style={{
              textAlign: 'center', backgroundColor: 'inherit', marginTop: 'auto',
            }}
            >
              <Paragraph ellipsis={{ rows: 10 }} style={{ color: '#dddddd' }}>
                <a href='//www.biomage.net/our-team'>Our team</a>
                &nbsp;&middot;&nbsp;
                <a href='mailto:hello@biomage.net'>Contact us</a>
              </Paragraph>
              <Paragraph ellipsis={{ rows: 10 }} style={{ color: '#999999' }}>
                &copy;
                {' '}
                {new Date().getFullYear()}
                {' '}
                Biomage Ltd
                {' & '}
                other affiliates and contributors.
              </Paragraph>
            </Footer>
          )}
        </div>

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
