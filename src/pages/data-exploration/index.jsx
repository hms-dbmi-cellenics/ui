import React from 'react';
import {
  PageHeader, Button, Dropdown,
} from 'antd';
import { Mosaic, MosaicWindow } from 'react-mosaic-component';
import { DownOutlined, PictureOutlined, ToolOutlined } from '@ant-design/icons';
import DraggableList from '../../components/draggable-list/DraggableList';
import SearchMenu from '../../components/SearchMenu';
import CellSetsTool from './components/cell-sets-tool/CellSetsTool';
import GeneListTool from './components/gene-list-tool/GeneListTool';
import DiffExprManager from './components/differential-expression-tool/DiffExprManager';
import Embedding from './components/embedding/Embedding';
import HeatmapPlot from './components/heatmap/HeatmapPlot';

import 'react-mosaic-component/react-mosaic-component.css';
import '@blueprintjs/core/lib/css/blueprint.css';

const experimentId = '5e959f9c9f4b120771249001';

const TILE_MAP = {
  'UMAP Embedding': <Embedding experimentId={experimentId} embeddingType='umap' />,
  Heatmap: <HeatmapPlot experimentId={experimentId} heatmapWidth={1300} />,
  'Cell set': <CellSetsTool experimentId={experimentId} />,
  'Gene list': <GeneListTool experimentId={experimentId} />,
  'Differential expression (simple)': <DiffExprManager experimentId={experimentId} view='compute' />,
};

const renderWindow = (child) => (
  <div style={{ margin: '4px' }}>
    {child}
  </div>
);

const categoryInfo = {
  Plots: <PictureOutlined />,
  Tools: <ToolOutlined />,
};

const categoryItems = {
  Tools: [
    {
      name: 'Cell set',
      description: 'Create and manage interesting groupings of cells.',
      key: 'cell-set-tool',
      renderer: () => <CellSetsTool experimentId={experimentId} />,
    },
    {
      name: 'Gene list',
      description: 'Find, organize, and annotate genes in your data set.',
      key: 'gene-list-tool',
      renderer: () => <GeneListTool experimentId={experimentId} />,
    },
    {
      name: 'Differential expression (simple)',
      description: 'Find and explore the most characteristic genes in a set of cells.',
      key: 'diff-expr-tool',
      renderer: () => <DiffExprManager experimentId={experimentId} view='compute' />,
    },
  ],
  Plots: [
    {
      key: 'embedding-plot',
      name: 'UMAP Embedding',
      description: 'Visualize cells clustered by genetic expression using a UMAP embedding.',
      renderer: () => <Embedding experimentId={experimentId} embeddingType='umap' />,
    },
    {
      key: 'heatmap-plot-data-expl',
      name: 'Heatmaps',
      description: 'Gain a high-level understanding of expression levels across large groups of genes and cells.',
      renderer: (width) => <HeatmapPlot experimentId={experimentId} heatmapWidth={width} />,
    },
  ],
};

class ExplorationViewPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      addMenuVisible: false,
      openedItems: {
        Tools: [
          categoryItems.Tools[0],
          categoryItems.Tools[1],
        ],
        Plots: categoryItems.Plots,
      },
    };
  }

  openItem(key, itemCategory) {
    const { openedItems } = this.state;

    if (openedItems[itemCategory].find((obj) => obj.key === key)) {
      return;
    }

    const itemToOpen = categoryItems[itemCategory].find((obj) => obj.key === key);
    openedItems[itemCategory].unshift(itemToOpen);
    this.setState({ openedItems });
  }

  renderItems(itemType) {
    const { openedItems } = this.state;
    const openedTools = openedItems[itemType];

    return (
      <DraggableList
        plots={openedTools}
        onChange={(newList) => {
          openedItems[itemType] = newList;
          this.setState({ openedItems });
        }}
      />
    );
  }

  render() {
    const searchMenu = (
      <SearchMenu
        options={categoryItems}
        categoryInfo={categoryInfo}
        onSelect={(key, category) => {
          this.openItem(key, category);
          this.setState({ addMenuVisible: false });
        }}
      />
    );

    const { addMenuVisible } = this.state;

    return (
      <>
        <PageHeader
          className='site-page-header'
          title='Investigator'
          subTitle='Powerful data exploration'
          style={{ width: '100%' }}
          extra={[
            <div>
              <Dropdown
                key='search-menu-dropdown'
                overlay={searchMenu}
                visible={addMenuVisible}
                onVisibleChange={(visible) => this.setState({ addMenuVisible: visible })}
              >
                <Button type='primary' onClick={() => this.setState({ addMenuVisible: !addMenuVisible })}>
                  Add
                  {' '}
                  <DownOutlined />
                </Button>
              </Dropdown>
            </div>,
          ]}
        />
        <div style={{ height: '100%', width: '100%', margin: 0 }}>
          <Mosaic
            renderTile={(id, path) => (
              <MosaicWindow path={path} createNode={() => 'Differential expression (simple)'} title={id}>
                {renderWindow(TILE_MAP[id])}
              </MosaicWindow>
            )}
            initialValue={{
              direction: 'row',
              first: {
                first: 'UMAP Embedding',
                second: 'Heatmap',
                direction: 'column',
              },
              second: {
                direction: 'column',
                first: 'Cell set',
                second: 'Gene list',
              },
              splitPercentage: 70,
            }}
          />
        </div>
      </>
    );
  }
}

export default ExplorationViewPage;
