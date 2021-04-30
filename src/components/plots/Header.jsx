import _ from 'lodash';
import React, { useEffect, useRef, useCallback } from 'react';
import useSWR from 'swr';
import {
  PageHeader, Row, Col, Button, Skeleton, Space,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import moment from 'moment';
import dynamic from 'next/dynamic';
import { useBeforeunload } from 'react-beforeunload';
import FeedbackButton from '../FeedbackButton';
import { savePlotConfig } from '../../redux/actions/componentConfig/index';
import itemRender from '../../utils/renderBreadcrumbLinks';
import getFromApiExpectOK from '../../utils/getFromApiExpectOK';

import { LOAD_CONFIG } from '../../redux/actionTypes/componentConfig';
import { initialPlotConfigStates } from '../../redux/reducers/componentConfig/initialState';

const KeyboardEventHandler = dynamic(
  () => import('react-keyboard-event-handler'),
  { ssr: false },
);

const Header = (props) => {
  const { experimentId, plotUuid, finalRoute } = props;

  const dispatch = useDispatch();
  const saved = !useSelector((state) => state.componentConfig[plotUuid]?.outstandingChanges);
  const lastUpdated = useSelector((state) => state.componentConfig[plotUuid]?.lastUpdated);
  const router = useRouter();
  const type = useSelector((state) => state.componentConfig[plotUuid]?.type);
  const { config, outstandingChanges } = useSelector((state) => state.componentConfig[plotUuid]) || {};
  const reset = useRef(true);
  const debounceSave = useCallback(_.debounce(() => dispatch(savePlotConfig(experimentId, plotUuid)), 2000), []);

  if (outstandingChanges) {
    reset.current = false;
  }
  // Add prompt to save if modified since last save if changes happened.

  useBeforeunload((e) => {
    if (!saved) {
      e.preventDefault();
    }
  });
  useEffect(() => {
    if (!saved && config) {
      debounceSave();
    }
  }, [config]);

  useEffect(() => {
    const showPopupWhenUnsaved = (url) => {
      // Only handle if we are navigating away.
      if (router.asPath === url || saved) {
        return;
      }

      // Show a confirmation dialog. Prevent moving away if the user decides not to.
      // eslint-disable-next-line no-alert
      if (
        // eslint-disable-next-line no-alert
        !window.confirm(
          'You have unsaved changes. Do you wish to save?',
        )
      ) {
        router.events.emit('routeChangeError');
        // Following is a hack-ish solution to abort a Next.js route change
        // as there's currently no official API to do so
        // See https://github.com/zeit/next.js/issues/2476#issuecomment-573460710
        // eslint-disable-next-line no-throw-literal
        throw `Route change to "${url}" was aborted (this error can be safely ignored). See https://github.com/zeit/next.js/issues/2476.`;
      } else {
        // if we click 'ok' the config is changed
        dispatch(savePlotConfig(experimentId, plotUuid));
      }
    };

    router.events.on('routeChangeStart', showPopupWhenUnsaved);

    return () => {
      router.events.off('routeChangeStart', showPopupWhenUnsaved);
    };
  }, [router.asPath, router.events, saved]);

  const { data } = useSWR(
    `/v1/experiments/${experimentId}`,
    getFromApiExpectOK,
  );

  if (!data || !config) {
    return <Skeleton active paragraph={{ rows: 1 }} title={{ width: 500 }} />;
  }

  const baseRoutes = [
    {
      path: 'experiments',
      breadcrumbName: 'Analyses',
    },
    {
      path: '[experimentId]',
      params: data?.experimentId,
      breadcrumbName: data?.experimentName,
    },
    {
      path: 'plots-and-tables',
      breadcrumbName: 'Plots and Tables',
    },
    finalRoute,
  ];

  const saveString = lastUpdated
    ? moment(lastUpdated)
      .fromNow()
      .toLowerCase()
    : 'never';
  const onClickSave = () => {
    if (saved) {
      return;
    }

    dispatch(savePlotConfig(experimentId, plotUuid));
  };

  const onClickReset = () => {
    dispatch({
      type: LOAD_CONFIG,
      payload: {
        experimentId,
        plotUuid,
        type,
        config: _.cloneDeep(initialPlotConfigStates[type]),
      },
    });
    dispatch(savePlotConfig(experimentId, plotUuid));
    reset.current = true;
  };
  return (
    <Row>
      <Col span={16}>
        <KeyboardEventHandler
          handleFocusableElements
          handleKeys={['ctrl+s', 'meta+s']}
          onKeyEvent={(key, e) => {
            onClickSave();
            e.preventDefault();
          }}
        />

        <PageHeader
          style={{ width: '100%', paddingTop: '12px', paddingBottom: '6px' }}
          title='Edit collection'
          breadcrumb={{ routes: baseRoutes, itemRender }}
          subTitle={`Last saved: ${saveString}`}
          extra={(
            <Space>
              <FeedbackButton key='feedback' />
              <Button
                key='reset'
                type='primary'
                onClick={onClickReset}
                disabled={reset.current}
              >
                Reset
              </Button>
            </Space>
          )}
        />
      </Col>
    </Row>
  );
};

Header.propTypes = {
  finalRoute: PropTypes.object.isRequired,
  experimentId: PropTypes.string.isRequired,
  plotUuid: PropTypes.string.isRequired,
};

export default React.memo(Header);
