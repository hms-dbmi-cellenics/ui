/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import MultiBackend from 'react-dnd-multi-backend';
import HTML5ToTouch from 'react-dnd-multi-backend/dist/cjs/HTML5toTouch';
import getDomainSpecificContent from 'utils/getDomainSpecificContent';
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
import { modules, obj2sTechs } from 'utils/constants';
import { useAppRouter } from 'utils/AppRouteProvider';
import experimentUpdatesHandler from 'utils/experimentUpdatesHandler';
import integrationTestConstants from 'utils/integrationTestConstants';
import pipelineStatusValues from 'utils/pipelineStatusValues';

import { DndProvider } from 'react-dnd';
import { loadSamples } from 'redux/actions/samples';
import calculatePipelinesRerunStatus from 'utils/data-management/calculatePipelinesRerunStatus';

const { Sider } = Layout;
const { Text } = Typography;

const checkEveryIsValue = (arr, value) => arr.every((item) => item === value);

const backendErrors = [
  pipelineStatusValues.FAILED,
  pipelineStatusValues.TIMED_OUT,
  pipelineStatusValues.ABORTED,
];

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

  const qcStatusKey = backendStatus?.pipeline?.status;
  const qcRunning = qcStatusKey === 'RUNNING';
  const qcRunningError = backendErrors.includes(qcStatusKey);

  const gem2sStatusKey = backendStatus?.gem2s?.status;
  const gem2sRunning = gem2sStatusKey === 'RUNNING';
  const gem2sRunningError = backendErrors.includes(gem2sStatusKey);
  const completedGem2sSteps = backendStatus?.gem2s?.completedSteps;
  const obj2sStatusKey = backendStatus?.obj2s?.status;

  const isObj2s = obj2sStatusKey && obj2sTechs.includes(selectedTechnology);

  const [pipelinesRerunStatus, setPipelinesRerunStatus] = useState(null);
  const obj2sRunning = obj2sStatusKey === 'RUNNING' && isObj2s;
  const obj2sRunningError = backendErrors.includes(obj2sStatusKey) && isObj2s;
  const completedObj2sSteps = backendStatus?.obj2s?.completedSteps;
  const obj2sComplete = (obj2sStatusKey === pipelineStatusValues.SUCCEEDED) && isObj2s;
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

  useEffect(() => {
    if (!experiment || !backendStatus) return;

    // The value of backend status is null for new experiments that have never run
    const setupPipeline = isObj2s ? 'obj2s' : 'gem2s';
    const {
      pipeline: qcBackendStatus, [setupPipeline]: setupBackendStatus,
    } = backendStatus ?? {};

    if (
      !setupBackendStatus
      || !experiment?.sampleIds?.length > 0
    ) return;

    setPipelinesRerunStatus(
      calculatePipelinesRerunStatus(
        setupBackendStatus,
        qcBackendStatus,
        experiment,
        isObj2s,
      ),
    );
  }, [backendStatus, experiment, samples]);

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

  const gem2sNotCreated = checkEveryIsValue(
    [gem2sStatusKey, obj2sStatusKey], pipelineStatusValues.NOT_CREATED,
  );

  const getObj2sStatus = () => {
    if (obj2sRunningError) {
      const errorMessage = pipelineErrorUserMessages[backendStatus?.obj2s?.error?.error];
      return getStatusObject('obj2s', 'error', errorMessage);
    }
    if (obj2sRunning) {
      return getStatusObject('obj2s', 'running', null, completedObj2sSteps);
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
    if (isObj2s) {
      return getObj2sStatus();
    }
    return getGem2sStatus() || getQcStatus();
  };

  const currentStatusScreen = getCurrentStatusScreen();

  const BigLogo = () => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(315deg, #5B070A 0%, #8f0b10 30%, #A80D12 100%)',
        paddingTop: '10px',
        paddingBottom: '10px',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <svg xmlns='http://www.w3.org/2000/svg' width={200} height={50}>
        <defs id='svg_document_defs'>
          <style id='IBM Plex Sans_Google_Webfont_import'>@import url(https://fonts.googleapis.com/css?family=IBM+Plex+Sans);</style>
        </defs>
        <g transform='translate(20, 25)'>
          <text
            style={{ outlineStyle: 'none' }}
            fontWeight='500'
            textRendering='geometricPrecision'
            fontFamily='IBM Plex Sans'
            fill='#F0F2F5'
            fontSize='25.00px'
            textAnchor='start'
            dominantBaseline='middle'
          >
            Cellenics®
          </text>
          {getDomainSpecificContent('ExtraLogoText')}
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
      disabledIfObj2sComplete: false,
    },
    {
      module: modules.DATA_PROCESSING,
      icon: <BuildOutlined />,
      name: 'Data Processing',
      disableIfNoExperiment: true,
      disabledByPipelineStatus: false,
      disabledIfObj2sComplete: true,
    },
    {
      module: modules.DATA_EXPLORATION,
      icon: <FundViewOutlined />,
      name: 'Data Exploration',
      disableIfNoExperiment: true,
      disabledByPipelineStatus: true,
      disabledIfObj2sComplete: false,
    },
    {
      module: modules.PLOTS_AND_TABLES,
      icon: <DatabaseOutlined />,
      name: 'Plots and Tables',
      disableIfNoExperiment: true,
      disabledByPipelineStatus: true,
      disabledIfObj2sComplete: false,
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

      if (obj2sComplete && currentModule === modules.DATA_PROCESSING) {
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
    module, icon, name, disableIfNoExperiment, disabledByPipelineStatus, disabledIfObj2sComplete,
  }) => {
    const needRerunPipeline = pipelinesRerunStatus === null || pipelinesRerunStatus.rerun;

    const notProcessedExperimentDisable = !routeExperimentId && disableIfNoExperiment
      && needRerunPipeline;

    const pipelineStatusDisable = disabledByPipelineStatus && (
      backendError || gem2sRunning || gem2sRunningError
      || waitingForQcToLaunch || qcRunning || qcRunningError
      || obj2sRunning || obj2sRunningError
    );

    const {
      DATA_EXPLORATION, DATA_MANAGEMENT, DATA_PROCESSING, PLOTS_AND_TABLES,
    } = modules;

    // disable links if user is not in one of the experiment analysis modules
    const nonExperimentModule = ![DATA_EXPLORATION,
      DATA_MANAGEMENT, DATA_PROCESSING, PLOTS_AND_TABLES]
      .includes(currentModule) && disableIfNoExperiment;
    const obj2sCompleteDisable = disabledIfObj2sComplete && obj2sComplete;

    return {
      key: module,
      icon,
      label: name,
      disabled: notProcessedExperimentDisable || pipelineStatusDisable
      || obj2sCompleteDisable || nonExperimentModule,
      onClick: () => navigateTo(
        module,
        { experimentId: currentExperimentId },
      ),
    };
  };

  if (!user) return <></>;

  const mainMenuItems = menuLinks
    .filter((item) => !item.disableIfNoExperiment)
    .map(menuItemRender);

  const groupMenuItems = menuLinks
    .filter((item) => item.disableIfNoExperiment)
    .map(menuItemRender);

  const groupItem = {
    type: 'group',
    label: !collapsed && (
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
          {experimentName && <Text style={{ color: '#999999' }}>Current analysis</Text>}
        </Space>
      </Tooltip>
    ),
    children: groupMenuItems,
  };

  const menuItems = [...mainMenuItems, groupItem];

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
                selectedKeys={menuLinks.filter(({ module }) => module === currentModule).map(({ module }) => module)}
                mode='inline'
                items={menuItems}
              />
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
