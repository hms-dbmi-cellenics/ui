import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Tabs, Button, Dropdown,
} from 'antd';
import { DownOutlined, PictureOutlined, ToolOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import Header from 'components/Header';

import CellSetsTool from 'components/data-exploration/cell-sets-tool/CellSetsTool';
import GeneListTool from 'components/data-exploration/gene-list-tool/GeneListTool';
import DiffExprManager from 'components/data-exploration/differential-expression-tool/DiffExprManager';
import Embedding from 'components/data-exploration/embedding/Embedding';
import HeatmapPlot, { COMPONENT_TYPE } from 'components/data-exploration/heatmap/HeatmapPlot';
import HeatmapSettings from 'components/data-exploration/heatmap/HeatmapSettings';
import MosaicCloseButton from 'components/MosaicCloseButton';
import { updateLayout, addWindow } from 'redux/actions/layout/index';
import SearchMenu from 'components/SearchMenu';
import 'react-mosaic-component/react-mosaic-component.css';
import MultiTileContainer from 'components/MultiTileContainer';

const { TabPane } = Tabs;

const ExplorationViewPage = ({
  experimentId, experimentData,
}) => {
  const dispatch = useDispatch();
  const layout = useSelector((state) => state.layout);
  const { windows, panel } = layout;
  const [selectedTab, setSelectedTab] = useState(panel);
  const [addMenuVisible, setAddMenuVisible] = useState(false);
  const { method } = useSelector((state) => (
    state.experimentSettings.processing?.configureEmbedding?.embeddingSettings
  )) || false;

  useEffect(() => {
    setSelectedTab(panel);
  }, [panel]);

  useEffect(() => {
    if (!method) {
      dispatch(loadProcessingSettings(experimentId));
    }
  }, []);
  const methodUppercase = method ? method.toUpperCase() : ' ';
  const embeddingTitle = `${methodUppercase} Embedding`;

  useEffect(() => {
    if (method && windows) {
      dispatch(updateLayout({
        ...windows,
        first: {
          ...windows.first,
          first: {
            ...windows.first.first,
            first: methodUppercase,
          },
        },
      }));
    }
  }, [method]);

  const TILE_MAP = {
    [methodUppercase]: {
      toolbarControls: <MosaicCloseButton key='remove-button-embedding' />,
      component: (width, height) => (
        <Embedding
          experimentId={experimentId}
          width={width}
          height={height}
        />
      ),
    },
    Heatmap: {
      toolbarControls: (
        <>
          <HeatmapSettings componentType={COMPONENT_TYPE} key='heatmap-settings' />
          <MosaicCloseButton key='remove-button-heatmap' />
        </>
      ),
      component: (width, height) => (
        <HeatmapPlot experimentId={experimentId} width={width} height={height} />
      ),
    },
    Genes: {
      toolbarControls: <MosaicCloseButton key='remove-button-genes' />,
      component: (width, height) => (
        <Tabs
          size='small'
          activeKey={selectedTab}
          onChange={(key) => { setSelectedTab(key); }}
        >
          <TabPane tab='Gene list' key='Gene list'>
            <GeneListTool experimentId={experimentId} width={width} height={height} />
          </TabPane>
          <TabPane tab='Differential expression' key='Differential expression'>
            <DiffExprManager
              experimentId={experimentId}
              view='compute'
              width={width}
              height={height}
            />
          </TabPane>
        </Tabs>
      ),
    },
    'Cell sets and Metadata': {
      toolbarControls: <MosaicCloseButton key='remove-button-data-management' />,
      component: (width, height) => (
        <CellSetsTool
          experimentId={experimentId}
          width={width}
          height={height}
        />
      ),
    },
  };

  const categoryItems = {
    Genes: [
      {
        description: 'Create and manage interesting groupings of cells.',
        key: 'Cell sets and Metadata',
      },
      {
        description: 'Find, organize, and annotate genes in your data set.',
        key: 'Gene list',
        group: 'Genes',
      },
      {
        description: 'Find and explore the most characteristic genes in a set of cells.',
        key: 'Differential expression',
        group: 'Genes',
      },
    ],
    Plots: [
      {
        key: `${methodUppercase}`,
        description: `Visualize cells clustered by genetic expression using a ${embeddingTitle}.`,
      },
      {
        key: 'Heatmap',
        description: 'Gain a high-level understanding of expression levels across large groups of genes and cells.',
      },
    ],
  };

  const categoryInfo = {
    Plots: <PictureOutlined />,
    Tools: <ToolOutlined />,
  };

  const searchMenu = (
    <SearchMenu
      options={categoryItems}
      categoryInfo={categoryInfo}
      onSelect={(key, category, belongsToGroup) => {
        dispatch(addWindow(key, belongsToGroup));
        setAddMenuVisible(false);
      }}
    />
  );

  return (
    <>
      <Header
        experimentId={experimentId}
        experimentData={experimentData}
        title='Data Exploration'
        extra={[(
          <Dropdown
            trigger={['click']}
            key='search-menu-dropdown'
            overlay={searchMenu}
            visible={addMenuVisible}
            onVisibleChange={(visible) => setAddMenuVisible(visible)}
          >
            <Button type='primary' onClick={() => setAddMenuVisible(!addMenuVisible)}>
              Add
              {' '}
              <DownOutlined />
            </Button>
          </Dropdown>
        )]}
      />
      <MultiTileContainer
        tileMap={TILE_MAP}
        initialArrangement={windows}
      />
    </>
  );
};

ExplorationViewPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
  experimentData: PropTypes.object.isRequired,
};

export default ExplorationViewPage;
