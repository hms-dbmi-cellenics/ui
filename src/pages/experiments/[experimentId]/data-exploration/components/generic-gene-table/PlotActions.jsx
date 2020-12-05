import React from 'react';
import PropTypes from 'prop-types';
import {
  Menu, Dropdown, Button,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';

import _ from 'lodash';
import { PlusOutlined, RedoOutlined, MinusOutlined } from '@ant-design/icons';
import { changeExpressionView } from '../../../../../../redux/actions/genes';
import { geneOperations } from '../../../../../../utils/geneTable/geneOperations';

const ComponentActions = (props) => {
  const { experimentId, componentName, componentUuid } = props;
  const dispatch = useDispatch();
  const selectedGenes = useSelector((state) => state.genes.selected);

  const performGeneOperation = (geneOperation) => {
    const newGenes = _.cloneDeep(selectedGenes);
    dispatch(changeExpressionView(experimentId, newGenes, componentUuid, geneOperation));
  };

  const menu = (
    <Menu size='small'>
      <Menu.Item key='0' icon={<PlusOutlined />} onClick={() => performGeneOperation(geneOperations.ADD)}>
        Add
      </Menu.Item>
      <Menu.Item key='1' icon={<MinusOutlined />} onClick={() => performGeneOperation(geneOperations.REMOVE)}>
        Remove
      </Menu.Item>
      <Menu.Item key='2' icon={<RedoOutlined />} onClick={() => performGeneOperation(geneOperations.OVERWRITE)}>
        Overwrite
      </Menu.Item>
    </Menu>
  );

  if (selectedGenes.length === 0) {
    return (<></>);
  }

  return (
    <Dropdown arrow type='link' size='small' overlay={menu} trigger={['click']}>
      <Button type='link' size='small'>
        {componentName}
        {' '}
        ...
      </Button>
    </Dropdown>
  );
};

ComponentActions.defaultProps = {
};

ComponentActions.propTypes = {
  experimentId: PropTypes.string.isRequired,
  componentName: PropTypes.string.isRequired,
  componentUuid: PropTypes.string.isRequired,
};

export default ComponentActions;
