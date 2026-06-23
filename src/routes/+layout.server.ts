import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ url }) => {
  return {
    currentPath: url.pathname
  };
};
