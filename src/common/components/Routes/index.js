import React from 'react';
import { Route } from 'react-router';

import Application from '../Application';
import HomePageRoutes from '../pages/HomePage/routes';

export default (
  <Route component={Application}>
    {HomePageRoutes}
  </Route>
);
