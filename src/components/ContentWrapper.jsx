/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useRef, useEffect } from 'react';

import PropTypes from 'prop-types';

import {
  Layout, Menu, Typography, Space, Tooltip,
} from 'antd';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import { Auth } from 'aws-amplify';
import {
  DatabaseOutlined,
  FundViewOutlined,
  BuildOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';

import initUpdateSocket from '../utils/initUpdateSocket';
import experimentUpdatesHandler from '../utils/experimentUpdatesHandler';

import { loadBackendStatus, discardChangedQCFilters } from '../redux/actions/experimentSettings';
import { runPipeline } from '../redux/actions/pipeline';

import PipelineRedirectToDataProcessing from './PipelineRedirectToDataProcessing';

import PreloadContent from './PreloadContent';
import GEM2SLoadingScreen from './GEM2SLoadingScreen';

import ChangesNotAppliedModal from './ChangesNotAppliedModal';

import Error from '../pages/_error';
import pipelineStatus from '../utils/pipelineStatusValues';

const { Sider, Footer } = Layout;

const { Paragraph, Text } = Typography;

const ContentWrapper = (props) => {
  const dispatch = useDispatch();

  const [isAuth, setIsAuth] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const { experimentId, experimentData, children } = props;
  const router = useRouter();
  const route = router?.route || '';

  const experiment = useSelector((state) => state?.experiments[experimentId]);
  const experimentName = experimentData?.experimentName || experiment?.name;

  const {
    loading: backendLoading,
    error: backendError,
    status: backendStatus,
  } = useSelector((state) => state.experimentSettings.backendStatus);
  const backendErrors = [pipelineStatus.FAILED, pipelineStatus.TIMED_OUT, pipelineStatus.ABORTED];

  const pipelineStatusKey = backendStatus.pipeline?.status;
  const pipelineRunning = pipelineStatusKey === 'RUNNING';
  const pipelineRunningError = backendErrors.includes(pipelineStatusKey);

  const gem2sStatusKey = backendStatus.gem2s?.status;
  const gem2sRunning = gem2sStatusKey === 'RUNNING';
  const gem2sRunningError = backendErrors.includes(gem2sStatusKey);
  const completedGem2sSteps = backendStatus.gem2s?.completedSteps;

  const changedQCFilters = useSelector((state) => state.experimentSettings.processing.meta.changedQCFilters);

  // This is used to prevent a race condition where the page would start loading immediately
  // when the backend status was previously loaded. In that case, `backendLoading` is `false`
  // and would be set to true only in the `loadBackendStatus` action, the time between the
  // two events would allow pages to load.
  const [backendStatusRequested, setBackendStatusRequested] = useState(false);

  const [changesNotAppliedModalPath, setChangesNotAppliedModalPath] = useState(null);

  const updateSocket = useRef(null);
  useEffect(() => {
    if (!experimentId) {
      return;
    }

    dispatch(loadBackendStatus(experimentId));

    updateSocket.current = initUpdateSocket(experimentId, experimentUpdatesHandler(dispatch));
  }, [experimentId]);

  useEffect(() => {
    if (backendStatusRequested) {
      return;
    }

    setBackendStatusRequested(true);
  }, [backendLoading]);

  useEffect(() => {
    Auth.currentAuthenticatedUser()
      .then(() => setIsAuth(true))
      .catch(() => {
        setIsAuth(false);
        Auth.federatedSignIn();
      });
  }, []);

  if (!isAuth) return <></>;

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

  const waitingForQcToLaunch = gem2sStatusKey === pipelineStatus.SUCCEEDED
    && pipelineStatusKey === pipelineStatus.NOT_CREATED;

  const transitionToModule = (path) => {
    if (changedQCFilters.size) {
      setChangesNotAppliedModalPath(path);
    } else {
      router.push(path);
    }
  };

  const renderContent = () => {
    if (experimentId) {
      if (
        backendLoading || !backendStatusRequested) {
        return <PreloadContent />;
      }

      if (backendError) {
        return <Error errorText='Could not get backend settings.' />;
      }

      if (gem2sRunningError) {
        return <GEM2SLoadingScreen experimentId={experimentId} gem2sStatus='error' />;
      }

      if (gem2sRunning || waitingForQcToLaunch) {
        return <GEM2SLoadingScreen gem2sStatus='running' completedSteps={completedGem2sSteps} />;
      }

      if (gem2sStatusKey === pipelineStatus.NOT_CREATED) {
        return <GEM2SLoadingScreen gem2sStatus='toBeRun' />;
      }

      if (pipelineRunningError && !route.includes('data-processing')) {
        return <PipelineRedirectToDataProcessing experimentId={experimentId} pipelineStatus='error' />;
      }

      if (pipelineRunning && !route.includes('data-processing')) {
        return <PipelineRedirectToDataProcessing experimentId={experimentId} pipelineStatus='running' />;
      }

      if (process.env.NODE_ENV === 'development') {
        return children;
      }

      if (pipelineStatusKey === pipelineStatus.NOT_CREATED && !route.includes('data-processing')) {
        return <PipelineRedirectToDataProcessing experimentId={experimentId} pipelineStatus='toBeRun' />;
      }
    }

    return children;
  };

  const menuItemRender = ({
    path, icon, name, disableIfNoExperiment, disabledByPipelineStatus,
  }) => {
    const noExperimentDisable = !experimentId ? disableIfNoExperiment : false;
    const pipelineStatusDisable = disabledByPipelineStatus && (
      backendError || gem2sRunning || gem2sRunningError
      || waitingForQcToLaunch || pipelineRunning || pipelineRunningError
    );

    const realPath = path.replace('[experimentId]', experimentId);

    return (
      <Menu.Item
        id={path}
        disabled={noExperimentDisable || pipelineStatusDisable}
        key={path}
        icon={icon}
        onClick={() => { transitionToModule(realPath); }}
        onKeyPress={() => { transitionToModule(realPath); }}
      >
        <a>{name}</a>
      </Menu.Item>
    );
  };

  const onRunQC = () => {
    dispatch(runPipeline(experimentId));
    setChangesNotAppliedModalPath(null);
  };

  const onDiscardQC = () => {
    router.push(changesNotAppliedModalPath);
    setChangesNotAppliedModalPath(null);

    dispatch(discardChangedQCFilters());
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <ChangesNotAppliedModal
        steps={changedQCFilters}
        visible={changesNotAppliedModalPath !== null}
        onRun={onRunQC}
        onDiscard={onDiscardQC}
        onCancel={() => setChangesNotAppliedModalPath(null)}
      />

      <Sider
        width={210}
        theme='dark'
        mode='inline'
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
            {menuLinks.filter((item) => !item.disableIfNoExperiment).map(menuItemRender)}

            <Menu.ItemGroup
              title={!collapsed && (
                <Tooltip title={experimentName} placement='right'>
                  <Space direction='vertical' style={{ width: '100%', cursor: 'default' }}>
                    <Text
                      style={{
                        width: '100%',
                        color: '#999999',
                      }}
                      strong
                      ellipsis
                    >
                      {experimentName || 'No analysis'}
                    </Text>
                    {experimentName && (
                      <Text style={{ color: '#999999' }}>
                        Current analysis
                      </Text>
                    )}
                  </Space>
                </Tooltip>

              )}
            >
              {menuLinks.filter((item) => item.disableIfNoExperiment).map(menuItemRender)}
            </Menu.ItemGroup>

          </Menu>
          {
            !collapsed && (
              <Footer style={{
                backgroundColor: 'inherit',
                marginTop: 'auto',
                paddingLeft: 24,
                paddingRight: 24,
              }}
              >
                <Paragraph ellipsis={{ rows: 10 }} style={{ color: '#999999' }}>
                  <a href='//www.biomage.net/our-team'>Team</a>
                  &nbsp;&middot;&nbsp;
                  <a href='//www.biomage.net/careers'>Careers</a>
                  &nbsp;&middot;&nbsp;
                  <a href='mailto:hello@biomage.net'>Contact</a>
                </Paragraph>

                <Paragraph ellipsis={{ rows: 10 }} style={{ color: '#999999' }}>
                  &copy;
                  {' '}
                  {new Date().getFullYear()}
                  {' '}
                  Biomage Ltd,
                  <br />
                  affiliates &amp; contributors.
                </Paragraph>

              </Footer>
            )
          }
        </div>

      </Sider>
      <Layout>
        {renderContent()}
      </Layout>
    </Layout>
  );
};

ContentWrapper.propTypes = {
  experimentId: PropTypes.string.isRequired,
  experimentData: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
};

export default ContentWrapper;
