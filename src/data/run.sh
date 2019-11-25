#!/bin/sh

go run buildtree.go <slocstats.json | jq >sourcetree.json
