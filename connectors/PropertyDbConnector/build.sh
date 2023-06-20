#!/usr/bin/env bash

CONNECTOR="PropertyDbConnector"

mkdir -p bin
zip bin/${CONNECTOR}.mez ${CONNECTOR}.pq resources.resx ${CONNECTOR}*.png
