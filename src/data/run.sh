#!/bin/sh

gocloc --output-type=json --by-file ~/github.com ~/gitlab.enterpriselab.ch ~/gitlab.peax.ch >slocstats.json || exit 1
go run buildtree.go <slocstats.json | jq >sourcetree.json
