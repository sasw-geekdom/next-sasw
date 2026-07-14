import { readFileSync, writeFileSync } from "node:fs";
// crude TS->JS: strip types by importing via a tiny transform is overkill; just re-implement calls by reading source
import { register } from "node:module";
