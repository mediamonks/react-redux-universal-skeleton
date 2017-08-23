import RenderMode from '../../common/data/enum/RenderMode';

export default server => {
  setRenderMode(server, RenderMode.CLIENT);
  setRenderMode(server, RenderMode.SERVER);
};

const setRenderMode = (server, renderMode) => {
  /* eslint-disable no-unused-vars */
  server.use(`/rendermode/${renderMode}`, (req, res, next) => {
    res
      .cookie('rendermode', renderMode, {
        maxAge: 1000 * 60 * 60 * 24,
      })
      .set('Content-Type', 'text/plain')
      .send(`Render mode set to "${renderMode}"`);
  });
  /* eslint-enable no-unused-vars */
};
