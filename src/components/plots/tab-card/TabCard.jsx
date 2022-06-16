import React from "react";
import { useState } from "react";

import { Card } from "antd";

import PropTypes from 'prop-types';

// Tool specific for plots and tables to make a card (from antd) with two tabs
// with the content specified in index.jsx
const TabCard = (props) => {
  const {
    addGenesTab,
    reorderGenesTab,
  } = props;

  const tabList = [
    {
      key: 'tab1',
      tab: 'Add/Remove genes',
    },
    {
      key: 'tab2',
      tab: 'Re-order genes',
    },
  ];

  const contentList = {
    tab1: addGenesTab,
    tab2: reorderGenesTab,
  };

  const [activeTabKey, setActiveTabKey] = useState('tab1');

  const onTabChange = (key) => {
    setActiveTabKey(key);
  };

  return (
    <>
      <Card
        style={{ width: '100%' }}
        bordered={false}
        tabList={tabList}
        activeTabKey={activeTabKey}
        onTabChange={(key) => onTabChange(key)}
      >
        {contentList[activeTabKey]}
      </Card>
    </>
  );
};

TabCard.propTypes = {
  addGenesTab: PropTypes.any.isRequired,
  reorderGenesTab: PropTypes.any.isRequired,
};

export default TabCard;
