import React, { useEffect } from 'react';
import {
  Avatar,
  Button,
  Menu,
  Dropdown,
} from 'antd';
import Link from 'next/link';
import { Hub } from '@aws-amplify/core';
import Auth from '@aws-amplify/auth';
import endUserMessages from 'utils/endUserMessages';
import { resetTrackingId } from 'utils/tracking';
import handleError from 'utils/http/handleError';
import { loadUser } from 'redux/actions/user';
import { useDispatch, useSelector } from 'react-redux';

const UserButton = () => {
  const dispatch = useDispatch();

  const user = useSelector((state) => state.user.current);

  useEffect(() => {
    Hub.listen('auth', ({ payload: { event } }) => {
      switch (event) {
        case 'signIn':
        case 'cognitoHostedUI':
          dispatch(loadUser());
          break;
        case 'signOut':
          resetTrackingId();
          break;
        case 'signIn_failure':
        case 'cognitoHostedUI_failure':
          handleError('error', endUserMessages.ERROR_SIGN_IN);
          break;
        default:
          break;
      }
    });
  }, []);

  const content = () => (
    <Menu>
      <Menu.ItemGroup key='g1' title={`Signed in as ${user?.attributes.name}`} />
      <Menu.Item key='profile' disabled>Your profile</Menu.Item>
      <Menu.Item key='settings'>
        <Link href='/settings/profile'>
          Settings
        </Link>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key='logout' onClick={async () => Auth.signOut()}>Sign out</Menu.Item>
    </Menu>
  );

  // This eventually needs to become a Dropdown with a menu.
  // For now, we can just put the login stuff direclty into the popover.
  return user ? (
    <Dropdown overlay={content()} trigger={['click']}>
      <Button
        aria-label='User settings'
        type='text'
        style={{
          border: 'none',
          padding: 0,
          margin: 0,
        }}
        icon={(
          <Avatar
            style={{
              backgroundColor: '#f56a00', verticalAlign: 'middle',
            }}
            size='medium'
          >
            {user.attributes.name[0].toUpperCase()}
          </Avatar>
        )}
      />
    </Dropdown>
  ) : (
    <Button
      type='dashed'
      onClick={() => Auth.federatedSignIn()}
    >
      Sign in
    </Button>
  );
};

UserButton.propTypes = {
};

UserButton.defaultProps = {
};

export default UserButton;
