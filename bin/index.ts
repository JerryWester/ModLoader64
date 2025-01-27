#!/usr/bin/env node

import program from 'commander';
import path from 'path';
import fs, { lstatSync } from 'fs';
import child_process from 'child_process';
import fse from 'fs-extra';
import crypto from 'crypto';
const isElevated = require('is-elevated');
const stripJsonComments = require('strip-json-comments');

let platformkey = '';
if (process.env.PROCESSOR_ARCHITECTURE === undefined) {
    platformkey = process.platform.trim() + 'x64';
} else {
    platformkey = process.platform.trim() + process.env.PROCESSOR_ARCHITECTURE;
}

program.option('-n, --init', 'init new project');
program.option('-b, --build', 'build mod');
program.option('-r, --run', 'run mod');
program.option('-d, --dist', 'pack mod');
program.option("-2, --runp2", "run p2");
program.option("-u, --update", "update");
program.option("-q, --bumpversion", "bump version number");
program.option("-i, --install <url>", "install dependency");
program.option("-s, --setroms <path>", "set rom directory");
program.option("-c, --clean", "cleans build dirs");
program.option("-a, --modulealias <alias>", "alias a module path");
program.option("-p, --modulealiaspath <path>", "alias a module path");
program.option("-z, --rebuildsdk", "rebuild sdk");
program.option("-t, --template <template>", "make project from template");
program.option("-e, --external <tool>");
program.option("-w, --window gui window");
program.option("-f, --sign <dir>", "sign files in a directory");

program.allowUnknownOption(true);
program.parse(process.argv);

interface SDK_Cat {
    roms_dir: string;
}

interface ModLoader64_Cat {
    SDK: SDK_Cat;
}

interface SDKCFG {
    ModLoader64: ModLoader64_Cat;
}

function makeSymlink(src, dest) {
    try {
        let p = path.parse(dest);
        if (!fs.existsSync(p.dir)) {
            fs.mkdirSync(p.dir);
        }
        fse.symlinkSync(src, dest, 'junction');
    } catch (err) {
        console.log(err);
    }
}

let original_dir: string = process.cwd();
process.chdir(path.join(__dirname, "../"));
if (!fs.existsSync("./SDK-config.json")) {
    console.log("This copy of the ModLoader64 SDK appears to have been improperly installed. Please consult the instructions and reinstall.");
}
let sdk_cfg: SDKCFG = JSON.parse(fs.readFileSync("./SDK-config.json").toString());
process.chdir(original_dir);

let tsconfig_path: string = path.resolve(path.join("./", "tsconfig.json"));
let tsconfig!: any;
if (fs.existsSync(tsconfig_path)) {
    tsconfig = JSON.parse(stripJsonComments(fs.readFileSync(tsconfig_path).toString()));
}

const MOD_REPO_URL: string = "https://nexus.inpureprojects.info/ModLoader64/repo/mods.json";
const CORE_REPO_URL: string = "https://nexus.inpureprojects.info/ModLoader64/repo/cores.json";
const GUI_SDK_URL: string = "https://nexus.inpureprojects.info/ModLoader64/launcher/sdk/win-ia32-unpacked.pak";
const GUI_SDK_URL_UNIX: string = "https://nexus.inpureprojects.info/ModLoader64/launcher/sdk/linux-unpacked.pak";

// I'm legit just wrapping curl right here... its built into win10 these days should be ok.
function getFileContents(url: string) {
    return child_process.execFileSync('curl', ['--silent', '-L', url], { encoding: 'utf8' });
}
function getBinaryContents(url: string) {
    return child_process.execFileSync('curl', ['-O', '--silent', '-L', url], { encoding: 'utf8' });
}

function saveTSConfig() {
    fs.writeFileSync(tsconfig_path, JSON.stringify(tsconfig, null, 2));
}

let WAITING_ON_EXTERNAL: boolean = false;

if (program.external !== undefined) {
    let original_dir: string = process.cwd();
    process.chdir(path.join(__dirname, "../"));
    let p = path.join(".", "tools", program.external);
    if (fs.existsSync(p)) {
        let meta: any = JSON.parse(fs.readFileSync(path.join(p, "package.json")).toString());
        let s = meta.main;
        let f = path.resolve(path.join(p, s));
        process.chdir(original_dir);
        child_process.fork(f, process.argv);
        WAITING_ON_EXTERNAL = true;
    }
    process.chdir(original_dir);
}

function updateCores() {
    let original_dir: string = process.cwd();
    let deps_dir: string = path.join("./", "external_cores");
    if (!fse.existsSync(deps_dir)) {
        return;
    }
    process.chdir(deps_dir);
    let cores: Array<string> = [];
    fs.readdirSync("./").forEach((file: string) => {
        let f: string = path.join("./", file);
        if (fs.lstatSync(f).isDirectory()) {
            let b2: string = process.cwd();
            process.chdir(path.join("./", f));
            cores.push(path.resolve("./build/cores"));
            child_process.execSync("git reset --hard origin/master");
            child_process.execSync("git pull");
            console.log(process.cwd());
            let meta2: any = JSON.parse(fs.readFileSync("./package.json").toString());
            console.log("Updating " + meta2.name);
            if (meta2.hasOwnProperty("dependencies")) {
                Object.keys(meta2.dependencies).forEach((key: string) => {
                    delete meta2.dependencies[key];
                });
            }
            if (meta2.hasOwnProperty("devDependencies")) {
                Object.keys(meta2.devDependencies).forEach((key: string) => {
                    delete meta2.dependencies[key];
                });
            }
            fse.writeFileSync("./package.json", JSON.stringify(meta2, null, 2));
            fse.removeSync("./node_modules");
            child_process.execSync("npm install");
            child_process.execSync("modloader64 -nbd");
            process.chdir(b2);
        }
    });
    process.chdir(original_dir);
}

function installCores() {
    let m_path: string = "./package.json";
    let meta: any = JSON.parse(fs.readFileSync(m_path).toString());
    if (!meta.hasOwnProperty("modloader64_deps")) {
        meta["modloader64_deps"] = {};
    }
    let mm_path: string = path.join(".", "src", meta.name, "package.json");
    if (!fs.existsSync(mm_path)) {
        mm_path = path.join(".", "cores", meta.name, "package.json");
    }
    let mod_meta: any = JSON.parse(fs.readFileSync(mm_path).toString());
    if (!mod_meta.hasOwnProperty("modloader64_deps")) {
        mod_meta["modloader64_deps"] = {};
    }
    Object.keys(mod_meta["modloader64_deps"]).forEach((key: string) => {
        child_process.execSync("modloader64 -i " + mod_meta["modloader64_deps"][key]);
    });
}

function install(url: string) {
    (async () => {
        let elv: boolean = await isElevated();
        /*         if (!elv && platformkey.indexOf("win32") > -1) {
                    console.log("Install must be run as administrator on Windows!");
                    return;
                } */
        console.log("Installing " + url + "...");
        let original_dir: string = process.cwd();
        let deps_dir: string = path.join("./", "external_cores");
        if (!fs.existsSync(deps_dir)) {
            fs.mkdirSync(deps_dir);
        }
        let meta: any = JSON.parse(fs.readFileSync("./package.json").toString());
        if (!meta.hasOwnProperty("modloader64_deps")) {
            meta["modloader64_deps"] = {};
        }
        let mod_meta: any = JSON.parse(fs.readFileSync(path.join(".", "src", meta.name, "package.json")).toString());
        if (!mod_meta.hasOwnProperty("modloader64_deps")) {
            mod_meta["modloader64_deps"] = {};
        }
        let temp: string = fse.mkdtempSync("ModLoader64SDK_");
        process.chdir(temp);
        try {
            child_process.execSync("git clone " + url);
        } catch (err) {
            if (err) {
                console.log("This core is already installed!");
            }
        }
        let gitdir: string = "";
        fse.readdirSync(".").forEach((file: string) => {
            let p: string = path.join(".", file);
            if (fs.lstatSync(p).isDirectory()) {
                gitdir = path.resolve(p);
            }
        });
        process.chdir(original_dir);
        let target: string = path.join(deps_dir, path.parse(gitdir).name);
        fse.moveSync(gitdir, target);
        fse.removeSync(temp);
        let cores: Array<string> = [];
        if (fs.lstatSync(target).isDirectory()) {
            process.chdir(target);
            child_process.execSync("modloader64 --init --build");
            cores.push(path.resolve("./build/cores"));
            fs.readdirSync("./build/cores").forEach((file: string) => {
                let meta2: any = JSON.parse(fs.readFileSync("./package.json").toString());
                if (!meta["modloader64_deps"].hasOwnProperty(meta2.name)) {
                    meta["modloader64_deps"][meta2.name] = url;
                }
                if (!mod_meta["modloader64_deps"].hasOwnProperty(meta2.name)) {
                    mod_meta["modloader64_deps"][meta2.name] = url;
                }
                if (tsconfig !== undefined) {
                    if (!tsconfig["compilerOptions"].hasOwnProperty("paths")) {
                        tsconfig["compilerOptions"]["paths"] = {};
                    }
                    console.log(tsconfig);
                    tsconfig["compilerOptions"]["paths"][meta2.name + "/*"] = [path.join("./libs", meta2.name) + "/*"];
                    saveTSConfig();
                }
            });
        }
        process.chdir(original_dir);
        fs.writeFileSync("./package.json", JSON.stringify(meta, null, 2));
        fs.writeFileSync(path.join(".", "src", meta.name, "package.json"), JSON.stringify(mod_meta, null, 2));
        if (!fs.existsSync("./libs")) {
            fs.mkdirSync("./libs");
        }
        for (let i = 0; i < cores.length; i++) {
            let c: string = cores[i];
            fs.readdirSync(c).forEach((dir: string) => {
                let f: string = path.join(c, dir);
                if (fs.lstatSync(f).isDirectory()) {
                    try {
                        fse.symlinkSync(f, path.resolve(path.join("./libs", path.parse(f).name)), 'junction');
                    } catch (err) {
                        if (err) {
                            console.log(err);
                        }
                    }
                }
            });
        }
    })();
}

if (!WAITING_ON_EXTERNAL) {
    if (program.rebuildsdk) {
        console.log("Rebuilding SDK...");
        let original_dir: string = process.cwd();
        process.chdir(path.join(__dirname, "../"));
        child_process.execSync("npm install");
        process.chdir(original_dir);
    }

    if (program.init) {
        let original_dir: string = process.cwd();
        console.log("Generating mod scaffolding...");
        child_process.execSync("npm init --yes");
        let meta: any = JSON.parse(fs.readFileSync("./package.json").toString());
        if (!fs.existsSync("./src")) {
            fs.mkdirSync("./src");
            fs.mkdirSync("./src/" + meta.name);
            process.chdir("./src/" + meta.name);
            child_process.execSync("npm init --yes");
        }
        try {
            process.chdir("./src/" + meta.name);
            child_process.execSync("npm install");
        } catch (err) { }
        process.chdir(original_dir);
        let mod_pkg: any = JSON.parse(fs.readFileSync(path.join(".", "package.json")).toString());
        if (mod_pkg.hasOwnProperty("dependencies")) {
            Object.keys(mod_pkg.dependencies).forEach((key: string) => {
                delete mod_pkg.dependencies[key];
            });
        }
        if (mod_pkg.hasOwnProperty("devDependencies")) {
            Object.keys(mod_pkg.devDependencies).forEach((key: string) => {
                delete mod_pkg.dependencies[key];
            });
        }
        fs.writeFileSync(path.join(".", "package.json"), JSON.stringify(mod_pkg, null, 2));
        child_process.execSync("npm install");
        if (!fs.existsSync("./node_modules")) {
            fs.mkdirSync("./node_modules");
        }
        console.log("Linking ModLoader64 API to project...");
        console.log("This might take a moment. Please be patient.");
        let our_pkg: any = JSON.parse(fs.readFileSync(path.join(__dirname, "../", "package.json")).toString());
        Object.keys(our_pkg.dependencies).forEach((key: string) => {
            makeSymlink(path.resolve(__dirname, "../", "node_modules", key), path.resolve(original_dir, "node_modules", key));
        });
        Object.keys(our_pkg.devDependencies).forEach((key: string) => {
            makeSymlink(path.resolve(__dirname, "../", "node_modules", key), path.resolve(original_dir, "node_modules", key));
        });
        makeSymlink(path.resolve(__dirname, "../", "node_modules", "modloader64_api"), path.resolve(original_dir, "node_modules", "modloader64_api"));
        console.log("Setting up TypeScript compiler...");
        child_process.execSync("npx tsc --init");
        fs.copyFileSync(path.join(__dirname, "../", "tsconfig.json"), "./tsconfig.json");
        if (fs.existsSync(tsconfig_path)) {
            tsconfig = JSON.parse(stripJsonComments(fs.readFileSync(tsconfig_path).toString()));
        }
        tsconfig["compilerOptions"]["paths"]["@" + meta.name + "/*"] = ["./src/" + meta.name + "/*"];
        saveTSConfig();
        console.log("Installing any required cores...");
        installCores();
    }

    if (program.setroms !== undefined) {
        sdk_cfg.ModLoader64.SDK.roms_dir = path.resolve(program.setroms);
        let original_dir: string = process.cwd();
        process.chdir(path.join(__dirname, "../"));
        fs.writeFileSync("./SDK-config.json", JSON.stringify(sdk_cfg, null, 2));
        process.chdir(original_dir);
    }

    if (program.bumpversion) {
        let original_dir: string = process.cwd();
        child_process.execSync("npm version --no-git-tag-version patch");
        let meta: any = JSON.parse(fs.readFileSync("./package.json").toString());
        let p: string = "./src/" + meta.name;
        process.chdir(p);
        child_process.execSync("npm version --no-git-tag-version patch");
        meta = JSON.parse(fs.readFileSync("./package.json").toString());
        console.log("New version number: " + meta.version);
        process.chdir(original_dir);
    }

    if (program.clean) {
        fse.removeSync("./build");
        fse.removeSync("./build2");
        fse.removeSync("./dist");
    }

    if (program.build) {
        let original_dir: string = process.cwd();
        console.log("Building mod. Please wait...");
        if (!fs.existsSync("./cores")) {
            fs.mkdirSync("./cores");
        }
        try {
            child_process.execSync("npx tsc");
        } catch (err) {
            if (err) {
                throw Error(err.stdout.toString());
            }
        }
        fse.copySync("./src", "./build/src");
        if (!fs.existsSync("./build/cores")) {
            fs.mkdirSync("./build/cores");
        }
        if (!fs.existsSync("./libs")) {
            fs.mkdirSync("./libs");
        }
        fse.copySync("./cores", "./build/cores");
        fse.copySync("./build/cores", "./libs");
        fs.readdirSync("./libs").forEach((file: string) => {
            let p: string = path.join("./libs", file);
            if (fs.lstatSync(p).isDirectory()) {
                child_process.execSync("npm link --local " + p);
            }
        });
        let meta: string = path.join(process.cwd(), "package.json");
        let m = JSON.parse(fs.readFileSync(meta).toString());
        if (m.hasOwnProperty("official")) {

        }
        if (m.hasOwnProperty("scripts")) {
            if (m.scripts.hasOwnProperty("ML64Postbuild")) {
                console.log("Executing postbuild script...");
                console.log(child_process.execSync("npm run ML64Postbuild").toString());
            }
        }
        process.chdir(original_dir);
    }

    if (program.sign) {
        var recursive = require("recursive-readdir");
        let original_dir: string = process.cwd();
        recursive(program.sign, function (err, files) {
            for (let i = 0; i < files.length; i++) {
                let _path = path.resolve(files[i]);
                let _parse = path.parse(files[i]);
                if (_parse.dir.indexOf("node_modules") > -1) continue;
                if (_parse.ext === ".js") {
                    let data = fs.readFileSync(_path);
                    const private_key = fse.readFileSync(path.resolve(__dirname, "..", "privateKey.pem"), 'utf-8')
                    const signer = crypto.createSign('sha256');
                    signer.update(data);
                    signer.end();
                    const signature = signer.sign(private_key)
                    fs.writeFileSync(_path.replace(".js", ".mls"), JSON.stringify({ sig: signature.toString('base64'), code: data.toString('base64') }));
                    fs.unlinkSync(_path);
                } else if (_path.indexOf(".js.map") > -1 || _parse.ext === ".ts") {
                    fs.unlinkSync(_path)
                }
            }
        });
        process.chdir(original_dir);
    }

    if (program.run) {
        console.log("Running mod. Please wait while we load the emulator...");
        let original_dir: string = process.cwd();
        if (program.window) {
            let isWindows: boolean = platformkey.indexOf("win32") > -1;
            let url = GUI_SDK_URL;
            if (!isWindows) {
                url = GUI_SDK_URL_UNIX;
            }
            let dir = "./win-ia32-unpacked";
            if (!isWindows) {
                dir = "./linux-unpacked";
            }
            let exe = "modloader64 gui.exe";
            if (!isWindows) {
                exe = "modloader64 gui";
            }
            process.chdir(original_dir);
            let file: string = dir + ".pak";
            if (!fs.existsSync(file)) {
                console.log("Downloading GUI files...");
                getBinaryContents(url);
            }
            if (!fs.existsSync(dir)) {
                child_process.execSync("paker -i " + file + " -o ./");
            }
            if (!fs.existsSync(path.resolve(dir, "ModLoader"))) {
                process.chdir(dir);
                console.log(process.cwd());
                child_process.execSync("\"" + exe + "\"");
                process.chdir(original_dir);
                fse.removeSync(path.resolve(dir, "ModLoader/roms"));
                fse.symlinkSync(path.resolve(sdk_cfg.ModLoader64.SDK.roms_dir), path.resolve(dir, "ModLoader/roms"));
                process.exit(1);
            }
            if (fse.existsSync(path.resolve(dir, "ModLoader/ModLoader64-config.json"))) {
                if (!lstatSync(path.resolve(dir, "ModLoader/ModLoader64-config.json")).isSymbolicLink()) {
                    process.chdir(original_dir);
                    fse.removeSync(path.resolve(dir, "ModLoader/ModLoader64-config.json"));
                    fse.symlinkSync(path.resolve("./ModLoader64-config.json"), path.resolve(dir, "ModLoader/ModLoader64-config.json"));
                }
            }
            fse.removeSync(path.resolve(dir, "ModLoader/mods"));
            fse.copySync("./build/src", path.resolve(dir, "ModLoader/mods"));
            process.chdir(dir);
            child_process.execSync("\"" + exe + "\" --devSkip");
            process.chdir(original_dir);
        } else {
            process.chdir(path.join(__dirname, "../"));
            let ml = child_process.exec("npm run start -- --mods=" + path.join(original_dir, "build", "src") + " --roms=" + path.resolve(sdk_cfg.ModLoader64.SDK.roms_dir) + " --cores=" + path.join(original_dir, "libs") + " --config=" + path.join(original_dir, "modloader64-config.json") + " --startdir " + original_dir);
            ml.stdout.on('data', function (data) {
                console.log(data);
            });
            ml.on('error', (err: Error) => {
                console.log(err);
            });
            ml.stderr.on('data', (data) => {
                console.log(data);
            });
        }
        process.chdir(original_dir);
    }

    if (program.dist) {
        let original_dir: string = process.cwd();
        const fsExtra = require('fs-extra');
        fsExtra.emptyDirSync("./dist");
        if (!fs.existsSync("./dist")) {
            fs.mkdirSync("./dist");
        }
        let f1: string = path.join(__dirname, "../");
        fse.copySync("./build/src", "./dist");
        fse.copySync("./build/cores", "./dist");
        process.chdir(path.join(".", "dist"));
        fs.readdirSync(".").forEach((file: string) => {
            let p: string = path.join(".", file);
            console.log(p);
            if (fs.lstatSync(p).isDirectory()) {
                let meta: string = path.join(p, "package.json");
                let alg = "";
                let m = JSON.parse(fs.readFileSync(meta).toString());
                if (m.hasOwnProperty("compression")) {
                    alg = "--algo=" + m["compression"];
                }
                child_process.execSync("node \"" + path.join(f1, "/bin/paker.js") + "\" --dir=\"" + "./" + p + "\" --output=\"" + "./" + "\" " + alg);
                console.log("Generated pak for " + file + ".");
            }
        });
        process.chdir(original_dir);
    }

    if (program.runp2) {
        console.log("Running mod. Please wait while we load the emulator...");
        let original_dir: string = process.cwd();
        let cfg: any = JSON.parse(fs.readFileSync(path.join(original_dir, "modloader64-config.json")).toString());
        cfg["ModLoader64"]["isServer"] = false;
        cfg["NetworkEngine.Client"]["isSinglePlayer"] = false;
        fs.writeFileSync(path.join(original_dir, "modloader64-p2-config.json"), JSON.stringify(cfg, null, 2));
        process.chdir(path.join(__dirname, "../"));
        let ml = child_process.exec("npm run start_2 -- --mods=" + path.join(original_dir, "build", "src") + " --roms=" + path.resolve(sdk_cfg.ModLoader64.SDK.roms_dir) + " --cores=" + path.join(original_dir, "libs") + " --config=" + path.join(original_dir, "modloader64-p2-config.json") + " --startdir " + original_dir);
        console.log("npm run start_2 -- --mods=" + path.join(original_dir, "build", "src") + " --roms=" + path.resolve(sdk_cfg.ModLoader64.SDK.roms_dir) + " --cores=" + path.join(original_dir, "libs") + " --config=" + path.join(original_dir, "modloader64-p2-config.json") + " --startdir " + original_dir);
        ml.stdout.on('data', function (data) {
            console.log(data);
        });
        ml.on('error', (err: Error) => {
            console.log(err);
        });
        ml.stderr.on('data', (data) => {
            console.log(data);
        });
        process.chdir(original_dir);
    }

    if (program.update) {
        let original_dir: string = process.cwd();
        process.chdir(path.join(__dirname, "../"));
        console.log("Updating ModLoader64...");
        child_process.execSync("git reset --hard origin/master");
        child_process.execSync("git pull");
        fse.removeSync("./node_modules");
        fse.removeSync("./Mupen64Plus");
        if (fse.existsSync("./build")) {
            fse.removeSync("./build");
        }
        if (fse.existsSync("./build2")) {
            fse.removeSync("./build2");
        }
        let ml = child_process.exec("npm install");
        ml.stdout.on('data', function (data) {
            console.log(data);
        });
        ml.on('exit', () => {
            process.chdir(original_dir);
            updateCores();
        });
    }

    if (program.install !== undefined) {
        if (program.install.indexOf("https://") > -1) {
            install(program.install);
        } else {
            console.log("Searching the nexus...");
            let core_repo: any = JSON.parse(getFileContents(CORE_REPO_URL));
            let mod_repo: any = JSON.parse(getFileContents(MOD_REPO_URL));
            if (Object.keys(core_repo).indexOf(program.install) > -1) {
                console.log("Found " + program.install + " in cores repo.");
                install(core_repo[program.install].git);
            } else if (Object.keys(mod_repo).indexOf(program.install) > -1) {
                console.log("Found " + program.install + " in mods repo.");
                console.log("Installing pak file...");
                let update: any = JSON.parse(getFileContents(mod_repo[program.install].url));
                getBinaryContents(update.url);
            }
        }
    }

    if (program.modulealiaspath !== undefined) {
        (async () => {
            let elv: boolean = await isElevated();
            if (!elv && platformkey.indexOf("win32") > -1) {
                console.log("Alias must be run as administrator on Windows!");
                return;
            }
            if (!fs.existsSync("./libs")) {
                fs.mkdirSync("./libs");
            }
            let p: string = path.resolve(program.modulealiaspath);
            let p2: string = path.resolve(path.join("./libs", path.parse(p).name));
            if (fs.lstatSync(p).isDirectory()) {
                fse.symlinkSync(p, p2);
            }
            console.log("Created alias for " + program.modulealiaspath + " -> " + program.modulealias);
            if (program.modulealias !== undefined) {
                let p: string = path.resolve(program.modulealiaspath);
                let p2: string = path.resolve(path.join("./libs", path.parse(p).name));
                let meta: any = JSON.parse(fs.readFileSync("./package.json").toString());
                let mod_meta: any = JSON.parse(fs.readFileSync(path.join(".", "src", meta.name, "package.json")).toString());
                if (!mod_meta.hasOwnProperty("modloader64_aliases")) {
                    mod_meta["modloader64_aliases"] = {};
                }
                //mod_meta["modloader64_aliases"]["@" + program.modulealias + "/*"] = [path.relative("./", p2) + "/*"];
                //fs.writeFileSync(path.join(".", "src", meta.name, "package.json"), JSON.stringify(mod_meta, null, 2));
                // TSConfig.
                tsconfig["compilerOptions"]["paths"]["@" + program.modulealias + "/*"] = [path.relative("./", p2) + "/*"];
                saveTSConfig();
            }
        })();
    }

    if (program.template !== undefined) {
        if (fse.existsSync("./external_cores/" + program.template)) {
            let t_path: string = path.join("./", "external_cores", program.template);
            let meta: any = JSON.parse(fs.readFileSync(path.join(t_path, "package.json")).toString());
            let m_path: string = path.join(t_path, "src", meta.name);
            let meta2: any = JSON.parse(fs.readFileSync(path.join(".", "package.json")).toString());
            fse.copySync(m_path, path.join(".", "src", meta2.name), {});
            let meta3: any = JSON.parse(fs.readFileSync(path.join(".", "src", meta2.name, "package.json")).toString());
            meta3.name = meta2.name;
            fse.writeFileSync(path.join(".", "src", meta2.name, "package.json"), JSON.stringify(meta3, null, 2));
        } else {
            console.log("Install the template first.");
        }
    }
}