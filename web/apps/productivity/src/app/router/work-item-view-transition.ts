type Location = { pathname: string; searchStr: string };

export function isWorkItemViewChange(from: Location, to: Location) {
  return from.pathname === to.pathname
    && /^(?:\/workspace\/projects\/[^/]+\/work-items|\/my-work)\/?$/.test(to.pathname)
    && new URLSearchParams(from.searchStr).get('view') !== new URLSearchParams(to.searchStr).get('view');
}
