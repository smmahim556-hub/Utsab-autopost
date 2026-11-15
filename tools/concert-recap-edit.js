// Phase 2 of tools/concert-recap.js (probe.yml takes only a script path): re-listen, then replace the Facebook caption of
// the posted reel(s) whose start offsets are listed below. state/concert.json changes here are not committed by probe.yml.
process.env.APPLY = '1';
process.env.EDIT = process.env.EDIT || '24.5,20';
require('./concert-recap');
