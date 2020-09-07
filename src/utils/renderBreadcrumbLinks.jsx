import React from 'react';
import Link from 'next/link';

function renderBreadcrumbLinks(route, params, routes, paths) {
  const last = routes.indexOf(route) === routes.length - 1;

  if (last) {
    return <span>{route.breadcrumbName}</span>;
  }

  const href = paths.join('/');

  const as = paths.map((path, i) => {
    if (path.includes('[')) {
      return routes[i].params;
    }
    return path;
  }).join('/');

  // We are using passHref, which will cause a `href` property
  // to be rendered into the anchor. ESLint warning is not
  // well-founded, therefore.
  /* eslint-disable jsx-a11y/anchor-is-valid */
  return (
    <Link href={`/${href}`} as={`/${as}`} passHref>
      <a>{route.breadcrumbName}</a>
    </Link>
  );
  /* eslint-enable jsx-a11y/anchor-is-valid */
}

export default renderBreadcrumbLinks;
