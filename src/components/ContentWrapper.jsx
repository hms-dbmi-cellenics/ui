/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useRef, useEffect } from 'react';

import PropTypes from 'prop-types';

import {
  Layout, Menu, Typography,
} from 'antd';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import {
  DatabaseOutlined,
  FundViewOutlined,
  BuildOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import NotificationManager from './notification/NotificationManager';
import initUpdateSocket from '../utils/initUpdateSocket';
import { loadPipelineStatus } from '../redux/actions/experimentSettings';
import PipelineRedirectToDataProcessing from './PipelineRedirectToDataProcessing';

import experimentUpdatesHandler from '../utils/experimentUpdatesHandler';

import PreloadContent from './PreloadContent';
import Error from '../pages/_error';

const { Sider, Footer } = Layout;
const { Paragraph } = Typography;

const ContentWrapper = (props) => {
  const dispatch = useDispatch();

  const [collapsed, setCollapsed] = useState(true);
  const { children } = props;

  const router = useRouter();
  const { experimentId } = router?.query || {};
  const route = router?.route || '';

  const {
    loading: pipelineLoading,
    error: pipelineError,
    status: workerAndPipelineStatus,
  } = useSelector((state) => state.experimentSettings.pipelineStatus);

  const pipelineStatusKey = workerAndPipelineStatus.pipeline?.status;
  const pipelineErrors = ['FAILED', 'TIMED_OUT', 'ABORTED'];

  const pipelineRunning = pipelineStatusKey === 'RUNNING';
  const pipelineRunningError = pipelineErrors.includes(pipelineStatusKey);
  // const pipelineRunning = false;
  // const pipelineRunningError = false;
  // This is used to prevent a race condition where the page would start loading immediately
  // when the pipeline status was previously loaded. In that case, `pipelineLoading` is `false`
  // and would be set to true only in the `loadPipelineStatus` action, the time between the
  // two events would allow pages to load.
  const [pipelineStatusRequested, setPipelineStatusRequested] = useState(false);

  const updateSocket = useRef(null);
  useEffect(() => {
    if (!experimentId) {
      return;
    }

    dispatch(loadPipelineStatus(experimentId));

    updateSocket.current = initUpdateSocket(experimentId, experimentUpdatesHandler(dispatch));
  }, [experimentId]);

  useEffect(() => {
    if (pipelineStatusRequested) {
      return;
    }

    setPipelineStatusRequested(true);
  }, [pipelineLoading]);

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

  const menuLinks = [
    {
      path: '/data-management',
      icon: <FolderOpenOutlined />,
      name: 'Data Management',
      disableIfNoExperiment: false,
      disabledByPipelineStatus: true,
    },
    {
      path: '/experiments/[experimentId]/data-processing',
      icon: <BuildOutlined />,
      name: 'Data Processing',
      disableIfNoExperiment: true,
      disabledByPipelineStatus: false,
    },
    {
      path: '/experiments/[experimentId]/data-exploration',
      icon: <FundViewOutlined />,
      name: 'Data Exploration',
      disableIfNoExperiment: true,
      disabledByPipelineStatus: true,
    },
    {
      path: '/experiments/[experimentId]/plots-and-tables',
      icon: <DatabaseOutlined />,
      name: 'Plots and Tables',
      disableIfNoExperiment: true,
      disabledByPipelineStatus: true,
    },
  ];

  const renderContent = () => {
    if (pipelineLoading || !pipelineStatusRequested) {
      return <PreloadContent />;
    }

    if (pipelineError) {
      return <Error errorText='Could not get current pipeline settings.' />;
    }

    if (pipelineRunningError && !route.includes('data-processing')) {
      return <PipelineRedirectToDataProcessing experimentId={experimentId} pipelineStatus='error' />;
    }

    if (pipelineRunning && !route.includes('data-processing')) {
      return <PipelineRedirectToDataProcessing experimentId={experimentId} pipelineStatus='running' />;
    }

    return children;
  };

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
          <Menu
            theme='dark'
            selectedKeys={
              menuLinks
                .filter(({ path }) => route.includes(path))
                .map(({ path }) => path)
            }
            mode='inline'
          >
            {menuLinks.map(({
              path, icon, name, disableIfNoExperiment, disabledByPipelineStatus,
            }) => {
              const noExperimentDisable = !experimentId ? disableIfNoExperiment : false;
              const pipelineStatusDisable = disabledByPipelineStatus && (
                pipelineError || pipelineRunning || pipelineRunningError
              );
              const menuItemDisabled = noExperimentDisable || pipelineStatusDisable;

              return (
                <Menu.Item
                  disabled={menuItemDisabled}
                  key={path}
                  icon={icon}
                >
                  <Link as={path.replace('[experimentId]', experimentId)} href={path} passHref>
                    <a>{name}</a>
                  </Link>
                </Menu.Item>
              );
            })}
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
        {renderContent()}
      </Layout>
    </Layout>
  );
};

ContentWrapper.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ContentWrapper;
