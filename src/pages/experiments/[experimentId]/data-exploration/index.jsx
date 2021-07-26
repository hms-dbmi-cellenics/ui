import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Tabs, Button, Dropdown,
} from 'antd';
import { Mosaic, MosaicWindow } from 'react-mosaic-component';
import ReactResizeDetector from 'react-resize-detector';
import { DownOutlined, PictureOutlined, ToolOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import Header from '../../../../components/Header';
import CellSetsTool from '../../../../components/data-exploration/cell-sets-tool/CellSetsTool';
import GeneListTool from '../../../../components/data-exploration/gene-list-tool/GeneListTool';
import DiffExprManager from '../../../../components/data-exploration/differential-expression-tool/DiffExprManager';
import Embedding from '../../../../components/data-exploration/embedding/Embedding';
import { COMPONENT_TYPE, HeatmapPlot } from '../../../../components/data-exploration/heatmap/HeatmapPlot';
import HeatmapSettings from '../../../../components/data-exploration/heatmap/HeatmapSettings';
import MosaicCloseButton from '../../../../components/MosaicCloseButton';
import { updateLayout, addWindow, addToWindow } from '../../../../redux/actions/layout';
import SearchMenu from '../../../../components/SearchMenu';
import 'react-mosaic-component/react-mosaic-component.css';

const { TabPane } = Tabs;

const renderWindow = (tile, width, height) => {
  if (tile) {
    return (
      <div style={{ padding: '10px' }}>
        {height && width ? tile(width, height) : <></>}
      </div>
    );
  }
  return <></>;
};

const ExplorationViewPage = ({
  experimentId, experimentData, route,
}) => {
  const dispatch = useDispatch();
  const layout = useSelector((state) => state.layout);
  const { windows, panel } = layout;
  const [selectedTab, setSelectedTab] = useState(panel);
  const [addMenuVisible, setAddMenuVisible] = useState(false);

  useEffect(() => {
    setSelectedTab(panel);
  }, [panel]);

  const TILE_MAP = {
    'UMAP Embedding': {
      toolbarControls: <MosaicCloseButton key='remove-button-embedding' />,
      component: (width, height) => (
        <Embedding
          experimentId={experimentId}
          embeddingType='umap'
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
    'Data Management': {
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
        key: 'Data Management',
        group: 'Genes',
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
        key: 'UMAP Embedding',
        description: 'Visualize cells clustered by genetic expression using a UMAP embedding.',
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
        if (belongsToGroup) {
          dispatch(addToWindow(key, belongsToGroup));
        } else {
          dispatch(addWindow(key));
        }
        setAddMenuVisible(false);
      }}
    />
  );

  return (
    <>
      <Header
        experimentId={experimentId}
        experimentData={experimentData}
        route={route}
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
      <div style={{ height: '100%', width: '100%', margin: 0 }}>
        <Mosaic
          renderTile={(id, path) => (
            <ReactResizeDetector
              handleWidth
              handleHeight
              refreshMode='throttle'
              refreshRate={500}
            >
              {({ width, height }) => (
                <MosaicWindow
                  path={path}
                  title={id}
                  toolbarControls={TILE_MAP[id]?.toolbarControls}
                  key={id}
                >
                  {renderWindow(TILE_MAP[id]?.component, width, height)}
                </MosaicWindow>
              )}
            </ReactResizeDetector>
          )}
          onRelease={(changedLayout) => {
            dispatch(updateLayout(changedLayout));
          }}
          initialValue={windows}
        />
      </div>
    </>
  );
};

ExplorationViewPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
  experimentData: PropTypes.object.isRequired,
  route: PropTypes.string.isRequired,
};

export default ExplorationViewPage;
