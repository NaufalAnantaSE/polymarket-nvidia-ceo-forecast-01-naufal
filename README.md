# NVIDIA CEO price forecaster

Offline deterministic forecast program for the make.fun Polymarket NVIDIA CEO bounty. It estimates robust recent price dispersion from each causal input history and emits five ordered quantiles for the required 240-minute horizon.

Run:

```sh
mkdir -p out
MAKEFUN_INPUT_DIR=input MAKEFUN_OUTPUT_DIR=out node --experimental-strip-types main.ts
```

The program uses only the supplied case files and standard Node.js APIs.
