import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Tabs } from 'antd';
import { Mosaic, MosaicWindow } from 'react-mosaic-component';
import ReactResizeDetector from 'react-resize-detector';
import Header from './components/header';
import CellSetsTool from './components/cell-sets-tool/CellSetsTool';
import GeneListTool from './components/gene-list-tool/GeneListTool';
import DiffExprManager from './components/differential-expression-tool/DiffExprManager';
import Embedding from './components/embedding/Embedding';
import HeatmapPlot from './components/heatmap/HeatmapPlot';
import { updateLayout } from '../../redux/actions/layout';
import 'react-mosaic-component/react-mosaic-component.css';
import '@blueprintjs/core/lib/css/blueprint.css';


const experimentId = '5e959f9c9f4b120771249001';

const { TabPane } = Tabs;

const renderWindow = (tile, width, height) => (
  <div style={{ margin: '5px' }}>
    {height && width ? tile(width, height) : <></>}
  </div>
);

const ExplorationViewPage = () => {
  const dispatch = useDispatch();
  const layout = useSelector((state) => state.layout);
  const { windows, panel } = layout;
  const [selectedTab, setSelectedTab] = useState(panel);
  useEffect(() => {
    setSelectedTab(panel);
  }, [panel]);

  const TILE_MAP = {
    'UMAP Embedding': () => <Embedding experimentId={experimentId} embeddingType='umap' />,
    Heatmap: (width, height) => (
      <HeatmapPlot experimentId={experimentId} width={width} height={height} />
    ),
    Tools: (width, height) => (
      <Tabs
        size='small'
        activeKey={selectedTab}
        onChange={(key) => { setSelectedTab(key); }}
      >
        <TabPane tab='Gene list' key='Gene list'>
          <GeneListTool experimentId={experimentId} width={width} height={height} />
        </TabPane>
        <TabPane tab='Differential expression' key='Differential expression'>
          <DiffExprManager experimentId={experimentId} view='compute' width={width} height={height} />
        </TabPane>
      </Tabs>
    ),
    'Cell set': (width, height) => <CellSetsTool experimentId={experimentId} width={width} height={height} />,
  };

  return (
    <>
      <Header />
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
                <MosaicWindow path={path} title={id}>
                  {renderWindow(TILE_MAP[id], width, height)}
                </MosaicWindow>
              )}
            </ReactResizeDetector>
          )}
          onChange={(changedLayout) => {
            dispatch(updateLayout(changedLayout));
          }}
          initialValue={windows}
        />
      </div>
    </>
  );
};

export default ExplorationViewPage;
