import React from 'react';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';

const GuardedLink = (props) => {
  const {
    href, onClick, onFail, onSuccess, children,
  } = props;

  const router = useRouter();

  const check = (url, onNavigate, fnFail, fnSuccess) => {
    if (!onNavigate()) {
      fnFail(url);
      return false;
    }

    if (fnSuccess) fnSuccess(url);

    router.push(url);
  };

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <span onClick={() => check(href, onClick, onFail, onSuccess)}>
      {children}
    </span>
  );
};

GuardedLink.propTypes = {
  href: PropTypes.string,
  onClick: PropTypes.func,
  onFail: PropTypes.func,
  onSuccess: PropTypes.func,
  children: PropTypes.node,
};

GuardedLink.defaultProps = {
  href: '',
  onClick: () => {},
  onFail: () => {},
  onSuccess: () => {},
  children: null,
};

export default GuardedLink;
