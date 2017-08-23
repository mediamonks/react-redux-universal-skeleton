const gitRev = require('git-rev');

/**
 * Generates build info json with information about the current state of git using the
 * git-rev module
 */
gitRev.short(function(commit) {
  gitRev.branch(function(branch) {
    gitRev.tag(function(tag) {
      const build = {
        date: new Date().toString(),
        commit: commit,
        branch: branch,
        tag: tag,
        release: branch + '-' + tag + '-' + commit,
      };

      process.stdout.write(JSON.stringify(build, null, '  '));
    });
  });
});
