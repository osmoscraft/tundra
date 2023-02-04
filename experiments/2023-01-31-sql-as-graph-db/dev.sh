#!/bin/bash
 
if [ -z "$(which inotifywait)" ]; then
    echo "inotifywait not installed."
    echo "In most distros, it is available in the inotify-tools package."
    exit 1
fi

if [ -z "$(which sqlite3)" ]; then
    echo "sqlite3 not installed."
    echo "In most distros, it is available in the sqlite3 package."
    exit 1
fi
 
# initial run
function run_task() {
  cat init.sql | sqlite3
}

run_task
 
# auto reload
inotifywait --recursive --monitor --format "%e %w%f" \
--event modify ./ \
| while read changed; do
  echo $changed
  run_task
done
