import React from 'react';
import {
  PageHeader, Space,
} from 'antd';
import PropTypes from 'prop-types';

import FeedbackButton from './FeedbackButton';
import itemRender from '../utils/renderBreadcrumbLinks';

const Header = (props) => {
  const {
    experimentId, experimentData, title, extra, route,
  } = props;

  const pathInformation = {
    'data-management': {
      breadcrumbName: 'Data Management',
    },
    'data-processing': {
      breadcrumbName: 'Data Processing',
    },
    experiments: {
      breadcrumbName: 'Analyses',
    },
    '[experimentId]': {
      breadcrumbName: experimentData.experimentName,
      params: experimentId,
    },
    'data-exploration': {
      breadcrumbName: 'Data Exploration',
    },
    'plots-and-tables': {
      breadcrumbName: 'Plots and Tables',
    },
  };

  const buildRoutes = (src) => {
    const pathComponents = src.split('/');

    return pathComponents
      .filter(
        (component) => component.length !== 0,
      )
      .map(
        (component) => ({
          path: component,
          ...pathInformation[component],
        }),
      );
  };

  return (
    <>
      <PageHeader
        title={title}
        style={{ width: '100%', paddingTop: '12px', paddingBottom: '6px' }}
        breadcrumb={{ routes: buildRoutes(route), itemRender }}
        extra={(
          <Space>
            <FeedbackButton />
            {extra}
          </Space>
        )}
      />
    </>
  );
};

Header.propTypes = {
  experimentId: PropTypes.string.isRequired,
  experimentData: PropTypes.object.isRequired,
  route: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  extra: PropTypes.array,
};

Header.defaultProps = {
  extra: [],
};

export default Header;
