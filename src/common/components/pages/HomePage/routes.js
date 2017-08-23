import React from 'react';
import { Route } from 'react-router';
import { getRouteComponentProp } from 'src/common/util/routeCallback';
import Pages from 'src/common/data/enum/Pages';

import HomePage from 'bundle-loader?lazy&reactHot&name=HomePage!./index';

const routes = <Route path={Pages.HOME} {...getRouteComponentProp(HomePage)} />;

export default routes;
