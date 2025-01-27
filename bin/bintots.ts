#!/usr/bin/env node

import program from 'commander';
import fs from 'fs';
import path from 'path';

program.option('-i, --input <file>', 'input file');
program.option('-d, --dir <dir>', 'directory');
program.parse(process.argv);

if (program.input) {
    let str: string = "export const " + path.parse(program.input).name.split(" ").join("_").split("-").join("_").replace(/[0-9]/, '') + ": Buffer = Buffer.from(\"";
    let buf: Buffer = fs.readFileSync(program.input);
    str += buf.toString('base64');
    str += "\", 'base64');\n";
    fs.writeFileSync(path.resolve(path.parse(program.input).dir, path.parse(program.input).name.split(" ").join("_").split("-").join("_").replace(/[0-9]/, '') + ".ts"), str);
} else if (program.dir) {
    let dir = path.resolve(program.dir);
    let str: string = "";
    fs.readdirSync(dir).forEach((file: string) => {
        let f = path.resolve(program.dir, file);
        str += "export const " + path.parse(f).name.split(" ").join("_").split("-").join("_").replace(/[0-9]/, '') + ": Buffer = Buffer.from(\"";
        let buf: Buffer = fs.readFileSync(f);
        str += buf.toString('base64');
        str += "\", 'base64');\n";
    });
    fs.writeFileSync(path.resolve(dir, path.parse(dir).name.split(" ").join("_").split("-").join("_").replace(/[0-9]/, '') + ".ts"), str);
}