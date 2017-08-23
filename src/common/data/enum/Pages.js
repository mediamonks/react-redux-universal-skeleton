/**
 * We often link to pages from other microservices or from pattern-lib component.
 * Currently they would need to import the Pages file from member or account, which is not
 * what we want; account or member files should only import files from their own folder
 * So instead this file lives in Common, so it can be properly imported from everywhere.
 */
const Pages = {
  HOME: '/',
};

export default Pages;
