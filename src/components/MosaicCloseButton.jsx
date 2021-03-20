import React from 'react';
import { MosaicContext, MosaicWindowContext } from 'react-mosaic-component';
import {
  CloseOutlined,
} from '@ant-design/icons';
import {
  Button, Tooltip,
} from 'antd';

const CloseButton = () => {
  const remove = (mosaicWindowActions, mosaicActions) => {
    mosaicActions.remove(mosaicWindowActions.getPath());
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
