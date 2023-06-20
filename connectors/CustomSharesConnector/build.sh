#!/usr/bin/env bash

CONNECTOR="CustomSharesConnector"

mkdir -p bin
zip bin/${CONNECTOR}.mez ${CONNECTOR}.pq resources.resx ${CONNECTOR}*.png
