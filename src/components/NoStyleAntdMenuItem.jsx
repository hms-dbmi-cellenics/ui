/* eslint-disable jsx-a11y/mouse-events-have-key-events */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import PropTypes from 'prop-types';
import { Menu } from 'antd';

import styles from 'utils/css/no-style-menu-item.module.css';

// When using antd's Menu we are forced to wrap things in Menu.Item to
// avoid having duplicate components.
// Menu.Item adds styling, margins and hover style effects that we don't need,
// so this component uses Menu.Item but removes all this superfluous styling
//
// For more information check:
// - https://ant.design/components/menu/#Notes-for-developers
// - https://ant.design/components/menu/#Why-will-Menu's-children-be-rendered-twice

const NoStyleAntdMenuItem = ({ children }) => (
  <Menu.Item key='metadataTracksMenuItem' className={styles['no-style-menu-item']}>
    <div onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  </Menu.Item>
);

NoStyleAntdMenuItem.defaultProps = {
  children: () => <></>,
};

NoStyleAntdMenuItem.propTypes = {
  children: PropTypes.node,
};

export default NoStyleAntdMenuItem;
