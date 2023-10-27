import React from 'react';
import { MosaicContext, MosaicWindowContext } from 'react-mosaic-component';
import {
  CloseOutlined,
} from '@ant-design/icons';
import {
  Button, Tooltip,
} from 'antd';
import { updateLayout } from 'redux/actions/layout/index';
import { useDispatch } from 'react-redux';

const CloseButton = () => {
  const dispatch = useDispatch();

  const remove = async (mosaicWindowActions, mosaicActions) => {
    await mosaicActions.remove(mosaicWindowActions.getPath());

    const currentMosaicStructure = mosaicActions.getRoot();
    dispatch(updateLayout(currentMosaicStructure));
  };

  return (
    <MosaicWindowContext.Consumer>
      {({ mosaicWindowActions }) => (
        <MosaicContext.Consumer>
          {({ mosaicActions }) => (
            <Tooltip title='Close'>
              <Button
                type='text'
                className='bp3-button bp3-minimal'
                icon={<CloseOutlined />}
                onClick={() => remove(mosaicWindowActions, mosaicActions)}
              />
            </Tooltip>
          )}
        </MosaicContext.Consumer>
      )}
    </MosaicWindowContext.Consumer>
  );
};

export default CloseButton;
