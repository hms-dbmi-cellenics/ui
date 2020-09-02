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

  return (
    <Link href={`/${href}`} as={`/${as}`} passHref>
      {route.breadcrumbName}
    </Link>
  );
}

export default renderBreadcrumbLinks;
