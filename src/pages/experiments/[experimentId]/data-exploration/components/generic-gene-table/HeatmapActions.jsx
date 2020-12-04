import React from 'react';
import PropTypes from 'prop-types';
import {
  Menu, Dropdown, Button,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';

import _ from 'lodash';
import { PlusOutlined } from '@ant-design/icons';
import { loadGeneExpression } from '../../../../../../redux/actions/genes';

const HeatmapActions = (props) => {
  console.log('lalalalalalalla');

  const { experimentId, listenerUuid } = props;
  const dispatch = useDispatch();
  const selectedGenes = useSelector((state) => state.genes.selected);

  const add = () => {
    const newGenes = _.cloneDeep(selectedGenes);
    dispatch(loadGeneExpression(experimentId, newGenes, listenerUuid));
  };

  const overwrite = () => {
    const newGenes = _.cloneDeep(selectedGenes);
    dispatch(loadGeneExpression(experimentId, newGenes, listenerUuid));
  };

  const remove = () => {
    dispatch(loadGeneExpression(experimentId, [], listenerUuid));
  };

  const menu = (
    <Menu size='small'>
      <Menu.Item key='0' onClick={add}>
        <PlusOutlined />
        Add
      </Menu.Item>
      <Menu.Item key='1' onClick={overwrite}>
        Overwrite
      </Menu.Item>
      <Menu.Item key='2' onClick={remove}>
        Remove
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown type='link' size='small' overlay={menu} trigger='click'>
      <Button type='link' size='small'>Heatmap ...</Button>
    </Dropdown>
  );
};

HeatmapActions.defaultProps = {
};

HeatmapActions.propTypes = {
  experimentId: PropTypes.string.isRequired,
  listenerUuid: PropTypes.string.isRequired,
};

export default HeatmapActions;
