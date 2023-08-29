/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import MultiBackend from 'react-dnd-multi-backend';
import HTML5ToTouch from 'react-dnd-multi-backend/dist/cjs/HTML5toTouch';

import {
  BuildOutlined,
  DatabaseOutlined,
  FolderOpenOutlined,
  FundViewOutlined,
} from '@ant-design/icons';
import {
  Layout,
  Menu,
  Space,
  Tooltip,
  Typography,
} from 'antd';

import pipelineErrorUserMessages from 'utils/pipelineErrorUserMessages';
import PrivacyPolicyIntercept from 'components/data-management/PrivacyPolicyIntercept';

import BrowserAlert from 'components/BrowserAlert';
import PreloadContent from 'components/PreloadContent';
import GEM2SLoadingScreen from 'components/GEM2SLoadingScreen';
import PipelineRedirectToDataProcessing from 'components/PipelineRedirectToDataProcessing';

import { getBackendStatus } from 'redux/selectors';
import { loadUser } from 'redux/actions/user';
import { loadBackendStatus } from 'redux/actions/backendStatus';

import { isBrowser, privacyPolicyIsNotAccepted } from 'utils/deploymentInfo';
import { modules } from 'utils/constants';
import { useAppRouter } from 'utils/AppRouteProvider';
import experimentUpdatesHandler from 'utils/experimentUpdatesHandler';
import integrationTestConstants from 'utils/integrationTestConstants';
import pipelineStatusValues from 'utils/pipelineStatusValues';
import calculateGem2sRerunStatus from 'utils/data-management/calculateGem2sRerunStatus';
import { DndProvider } from 'react-dnd';
import { loadSamples } from 'redux/actions/samples';

const { Sider } = Layout;
const { Text } = Typography;

const checkEveryIsValue = (arr, value) => arr.every((item) => item === value);

const ContentWrapper = (props) => {
  const dispatch = useDispatch();

  const [collapsed, setCollapsed] = useState(false);

  const { routeExperimentId, experimentData, children } = props;
  const { navigateTo, currentModule } = useAppRouter();

  const currentExperimentIdRef = useRef(routeExperimentId);
  const selectedExperimentID = useSelector((state) => state?.experiments?.meta?.activeExperimentId);

  const domainName = useSelector((state) => state.networkResources.domainName);
  const user = useSelector((state) => state.user.current);

  const samples = useSelector((state) => state.samples);
  const selectedTechnology = (samples[experimentData?.sampleIds?.[0]]?.type || false);

  useEffect(() => {
    // selectedExperimentID holds the value in redux of the selected experiment
    // after loading a page it is determined whether to use that ID or the ID in the route URL
    // i.e. when we are in data management there is not exp ID in the URL so we get it from redux
    if (!selectedExperimentID && !routeExperimentId) return;

    if (currentModule === modules.DATA_MANAGEMENT) {
      currentExperimentIdRef.current = selectedExperimentID;
      return;
    }

    if (currentExperimentIdRef.current === routeExperimentId) return;

    currentExperimentIdRef.current = routeExperimentId;
  }, [currentModule, selectedExperimentID, routeExperimentId]);

  const currentExperimentId = currentExperimentIdRef.current;
  const experiment = useSelector((state) => state?.experiments[currentExperimentId]);
  const experimentName = experimentData?.experimentName || experiment?.name;

  const {
    loading: backendLoading,
    error: backendError,
    status: backendStatus,
  } = useSelector(getBackendStatus(currentExperimentId));
  const gem2sBackendStatus = backendStatus?.gem2s;
  const backendErrors = [pipelineStatusValues.FAILED, pipelineStatusValues.TIMED_OUT, pipelineStatusValues.ABORTED];

  const qcStatusKey = backendStatus?.pipeline?.status;
  const qcRunning = qcStatusKey === 'RUNNING';
  const qcRunningError = backendErrors.includes(qcStatusKey);

  const gem2sStatusKey = backendStatus?.gem2s?.status;
  const gem2sRunning = gem2sStatusKey === 'RUNNING';
  const gem2sRunningError = backendErrors.includes(gem2sStatusKey);
  const completedGem2sSteps = backendStatus?.gem2s?.completedSteps;
  const seuratStatusKey = backendStatus?.seurat?.status;

  const isSeurat = seuratStatusKey && selectedTechnology === 'seurat';

  const seuratBackendStatus = backendStatus?.seurat;
  const seuratRunning = seuratStatusKey === 'RUNNING' && isSeurat;
  const seuratRunningError = backendErrors.includes(seuratStatusKey) && isSeurat;
  const completedSeuratSteps = backendStatus?.seurat?.completedSteps;
  const seuratComplete = (seuratStatusKey === pipelineStatusValues.SUCCEEDED) && isSeurat;
  const waitingForQcToLaunch = gem2sStatusKey === pipelineStatusValues.SUCCEEDED
    && qcStatusKey === pipelineStatusValues.NOT_CREATED;
  // This is used to prevent a race condition where the page would start loading immediately
  // when the backend status was previously loaded. In that case, `backendLoading` is `false`
  // and would be set to true only in the `loadBackendStatus` action, the time between the
  // two events would allow pages to load.
  const [backendStatusRequested, setBackendStatusRequested] = useState(false);

  useEffect(() => {
    if (!currentExperimentId) return;
    if (!backendLoading) dispatch(loadBackendStatus(currentExperimentId));
    // need to load the samples to get the selected technology of the experiment
    // in the future, selected technology can be moved to under .experiments
    if (!samples[experimentData?.sampleIds?.[0]]) dispatch(loadSamples(routeExperimentId));
    if (isBrowser) {
      import('utils/socketConnection')
        .then(({ default: connectionPromise }) => connectionPromise)
        .then((io) => {
          const cb = experimentUpdatesHandler(dispatch);

          // Unload all previous socket.io hooks that may have been created for a different
          // experiment.
          io.off();
          io.on(`ExperimentUpdates-${currentExperimentId}`, (update) => cb(currentExperimentId, update));
        });
    }
  }, [routeExperimentId]);

  useEffect(() => {
    if (backendStatusRequested) {
      return;
    }

    setBackendStatusRequested(true);
  }, [backendLoading]);

  const [gem2sRerunStatus, setGem2sRerunStatus] = useState(null);

  useEffect(() => {
    if (!experiment) return;

    const pipelineStatus = calculateGem2sRerunStatus(
      gem2sBackendStatus, experiment,
    );

    setGem2sRerunStatus(pipelineStatus);
  }, [gem2sBackendStatus, experiment, samples]);

  const [seuratRerunStatus, setSeuratRerunStatus] = useState(null);

  useEffect(() => {
    if (!experiment) return;

    const pipelineStatus = calculateGem2sRerunStatus(
      seuratBackendStatus, experiment,
    );

    setSeuratRerunStatus(pipelineStatus);
  }, [seuratBackendStatus, experiment, samples]);

  useEffect(() => {
    dispatch(loadUser());
  }, []);

  if (!user) return <></>;
  const getStatusObject = (type, status, message = null, completedSteps = null) => ({
    type,
    status,
    ...(message && { message }),
    ...(completedSteps && { completedSteps }),
  });

  const gem2sNotCreated = checkEveryIsValue([gem2sStatusKey, seuratStatusKey], pipelineStatusValues.NOT_CREATED);

  const getSeuratStatus = () => {
    if (seuratRunningError) {
      const errorMessage = pipelineErrorUserMessages[backendStatus?.seurat?.error?.error];
      return getStatusObject('seurat', 'error', errorMessage);
    }
    if (seuratRunning) {
      return getStatusObject('seurat', 'running', null, completedSeuratSteps);
    }
    return null;
  };

  const getGem2sStatus = () => {
    if (gem2sRunningError) return getStatusObject('gem2s', 'error');
    if (gem2sRunning && experiment?.isSubsetted) {
      return getStatusObject('gem2s', 'subsetting', null, completedGem2sSteps);
    }
    if (gem2sRunning || waitingForQcToLaunch) {
      return getStatusObject('gem2s', 'running', null, completedGem2sSteps);
    }
    if (gem2sNotCreated) return getStatusObject('gem2s', 'toBeRun');
    return null;
  };

  const getQcStatus = () => {
    if (currentModule !== modules.DATA_PROCESSING) {
      if (qcRunningError) return getStatusObject('qc', 'error');
      if (qcRunning) return getStatusObject('qc', 'running');
      if (qcStatusKey === pipelineStatusValues.NOT_CREATED) {
        return getStatusObject('qc', 'toBeRun');
      }
    }
    return null;
  };

  const getCurrentStatusScreen = () => {
    if (isSeurat) {
      return getSeuratStatus();
    }
    return getGem2sStatus() || getQcStatus();
  };

  const currentStatusScreen = getCurrentStatusScreen();

  const BigLogo = () => (
    <div
      style={{
        background: 'linear-gradient(315deg, #5B070A 0%, #8f0b10 30%, #A80D12 100%)',
        paddingLeft: '32px',
        paddingTop: '15px',
        paddingBottom: '15px',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <svg xmlns='http://www.w3.org/2000/svg' width={110} height={30}>
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
            Cellenics
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
            textAnchor='start'
          />
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
      <svg xmlns='http://www.w3.org/2000/svg' width={100} height={30}>
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
        </g>
      </svg>
    </div>
  );

  const menuLinks = [
    {
      module: modules.DATA_MANAGEMENT,
      icon: <FolderOpenOutlined />,
      name: 'Data Management',
      disableIfNoExperiment: false,
      disabledByPipelineStatus: true,
      disabledIfSeuratComplete: false,
    },
    {
      module: modules.DATA_PROCESSING,
      icon: <BuildOutlined />,
      name: 'Data Processing',
      disableIfNoExperiment: true,
      disabledByPipelineStatus: false,
      disabledIfSeuratComplete: true,
    },
    {
      module: modules.DATA_EXPLORATION,
      icon: <FundViewOutlined />,
      name: 'Data Exploration',
      disableIfNoExperiment: true,
      disabledByPipelineStatus: true,
      disabledIfSeuratComplete: false,
    },
    {
      module: modules.PLOTS_AND_TABLES,
      icon: <DatabaseOutlined />,
      name: 'Plots and Tables',
      disableIfNoExperiment: true,
      disabledByPipelineStatus: true,
      disabledIfSeuratComplete: false,
    },
  ];

  const renderContent = () => {
    if (routeExperimentId) {
      if (
        backendLoading || !backendStatusRequested) {
        return <PreloadContent />;
      }
      if (currentStatusScreen && currentStatusScreen.type !== 'qc') {
        return (
          <GEM2SLoadingScreen
            experimentId={routeExperimentId}
            pipelineStatus={currentStatusScreen.status}
            pipelineType={currentStatusScreen.type}
            pipelineErrorMessage={currentStatusScreen?.message}
            completedSteps={currentStatusScreen?.completedSteps}
          />
        );
      }
      if (currentStatusScreen?.type === 'qc') {
        return (
          <PipelineRedirectToDataProcessing
            experimentId={routeExperimentId}
            pipelineStatus={currentStatusScreen.status}
          />
        );
      }

      if (seuratComplete && currentModule === modules.DATA_PROCESSING) {
        navigateTo(modules.DATA_EXPLORATION, { experimentId: routeExperimentId });
        return <></>;
      }

      if (process.env.NODE_ENV === 'development') {
        return children;
      }
    }

    return children;
  };

  const menuItemRender = ({
    module, icon, name, disableIfNoExperiment, disabledByPipelineStatus, disabledIfSeuratComplete,
  }) => {
    const needRunGem2s = !isSeurat && (!gem2sRerunStatus || gem2sRerunStatus.rerun);
    const needRunSeurat = isSeurat && (!seuratRerunStatus || seuratRerunStatus.rerun);

    const notProcessedExperimentDisable = !routeExperimentId && disableIfNoExperiment
      && (needRunGem2s || needRunSeurat);

    const pipelineStatusDisable = disabledByPipelineStatus && (
      backendError || gem2sRunning || gem2sRunningError
      || waitingForQcToLaunch || qcRunning || qcRunningError
      || seuratRunning || seuratRunningError
    );

    const {
      DATA_EXPLORATION, DATA_MANAGEMENT, DATA_PROCESSING, PLOTS_AND_TABLES,
    } = modules;

    // disable links if user is not in one of the experiment analysis modules
    const nonExperimentModule = ![DATA_EXPLORATION,
      DATA_MANAGEMENT, DATA_PROCESSING, PLOTS_AND_TABLES]
      .includes(currentModule) && disableIfNoExperiment;
    const seuratCompleteDisable = disabledIfSeuratComplete && seuratComplete;

    return (
      <Menu.Item
        id={module}
        disabled={notProcessedExperimentDisable || pipelineStatusDisable
          || seuratCompleteDisable || nonExperimentModule}
        key={module}
        icon={icon}
        onClick={() => navigateTo(
          module,
          { experimentId: currentExperimentId },
        )}
      >
        {name}
      </Menu.Item>
    );
  };

  if (!user) return <></>;

  return (
    <>
      <DndProvider backend={MultiBackend} options={HTML5ToTouch}>
        {/* Privacy policy only for biomage deployment */}
        {privacyPolicyIsNotAccepted(user, domainName) && (
          <PrivacyPolicyIntercept user={user} onOk={() => dispatch(loadUser())} />
        )}
        <BrowserAlert />
        <Layout style={{ minHeight: '100vh' }}>
          <Sider
            style={{
              overflow: 'auto', height: '100vh', position: 'fixed', left: 0,
            }}
            width={210}
            theme='dark'
            mode='inline'
            collapsible
            collapsed={collapsed}
            onCollapse={(collapse) => setCollapsed(collapse)}
          >
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {collapsed ? <SmallLogo /> : <BigLogo />}
              <Menu
                data-test-id={integrationTestConstants.ids.NAVIGATION_MENU}
                theme='dark'
                selectedKeys={
                  menuLinks
                    .filter(({ module }) => module === currentModule)
                    .map(({ module }) => module)
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
            </div>
          </Sider>
          <Layout
            style={!collapsed ? { marginLeft: '210px' } : { marginLeft: '80px' }} // this is the collapsed width for our sider
          >
            {renderContent()}
          </Layout>
        </Layout>
      </DndProvider>
    </>
  );
};

ContentWrapper.propTypes = {
  routeExperimentId: PropTypes.string,
  experimentData: PropTypes.object,
  children: PropTypes.node,
};

ContentWrapper.defaultProps = {
  routeExperimentId: null,
  experimentData: null,
  children: null,
};

export default ContentWrapper;
