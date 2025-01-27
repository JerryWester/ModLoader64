import * as fs from 'fs-extra';
import program from 'commander';
import path from 'path';
import findRemoveSync from 'find-remove';
var recursive = require("recursive-readdir");
import child_process from 'child_process';
import zip from 'adm-zip';
import fse from 'fs-extra';
import crypto from 'crypto';

var isWin = process.platform === "win32";

const copyNodeModules = require('copy-node-modules');

program.option('-s, --step <type>', 'build step');
program.parse(process.argv);

switch (program.step) {
    case "prebuild": {
        prebuild();
        break;
    }
    case "build": {
        build();
        break;
    }
    case "postbuild": {
        postbuild();
        break;
    }
    case "pushModules": {
        pushModules();
        break;
    }
    case "installEmulator": {
        getEmulator();
        break;
    }
    case "player2": {
        player2();
        break;
    }
    case "bump": {
        bump();
        break;
    }
    case "clean": {
        clean();
        break;
    }
    case "push": {
        pushToServer();
        break;
    }
    case "pushLive": {
        pushToLiveServer();
        break;
    }
    case "sign": {
        sign();
        break;
    }
}

function clean() {
    console.log("Cleaning...");
    if (fs.existsSync("./build")) {
        fs.removeSync("./build");
    }
    if (fs.existsSync("./build2")) {
        fs.removeSync("./build2");
    }
}

function bump() {
    let original_dir: string = process.cwd();
    child_process.execSync("npm version --no-git-tag-version patch");
    let u: any = JSON.parse(fs.readFileSync("./update.json").toString());
    let p: any = JSON.parse(fs.readFileSync("./package.json").toString());
    u["version"] = p["version"];
    fs.writeFileSync("./update.json", JSON.stringify(u, null, 2));
    process.chdir("./src");
    child_process.execSync("npm version --no-git-tag-version patch");
    process.chdir(original_dir);
}

function getEmulator() {
    let platformkey = '';
    if (process.arch === undefined) {
        platformkey = process.platform.trim() + 'x64';
    } else {
        platformkey = process.platform.trim() + process.arch;
    }
    if (!fs.existsSync("./Mupen64Plus")) {
        fs.mkdirSync("./Mupen64Plus");
    }
    console.log(platformkey);
    if (platformkey.indexOf("win32") > -1) {
        if (platformkey.indexOf("64") > -1) {
            console.log("./node_modules/modloader64-platform-deps/Windows64/emulator.pak");
            fs.copyFileSync("./node_modules/modloader64-platform-deps/Windows64/emulator.pak", "./Mupen64Plus/emulator.pak");
        } else {
            console.log("./node_modules/modloader64-platform-deps/Windows/emulator.pak");
            fs.copyFileSync("./node_modules/modloader64-platform-deps/Windows/emulator.pak", "./Mupen64Plus/emulator.pak");
        }
    } else if (platformkey.indexOf("linux") > -1) {
        fs.copyFileSync("./node_modules/modloader64-platform-deps/Linux/emulator.pak", "./Mupen64Plus/emulator.pak");
    }
}

function pushModules() {
    console.log("Cleaning...");
    let original_dir: string = process.cwd();

    if (fs.existsSync("./build")) {
        fs.removeSync("./build");
    }
    if (fs.existsSync("./build2")) {
        fs.removeSync("./build2");
    }
    if (fs.existsSync("./dist")) {
        fs.removeSync("./dist");
    }
    console.log("Building...");
    child_process.execSync("npm run build_dist");
    fs.removeSync("./build/roms");

    const srcDir = '.';
    const dstDir = './build';
    console.log("Copying node_modules...");
    copyNodeModules(srcDir, dstDir, { devDependencies: false }, (err, results) => {
        if (err) {
            console.error(err);
            return;
        }
        if (!fs.existsSync("./build/node_modules/modloader64_api")) {
            fs.mkdirSync("./build/node_modules/modloader64_api");
        }

        fs.copySync("./API/build", "./build/node_modules/modloader64_api");

        fs.mkdirSync("./dist");
        console.log("Putting together platform specific files...");
        fs.copySync("./build", "./dist/windows");
        fs.copySync("./build", "./dist/linux");
        //fs.copySync("./build", "./dist/mac");
        //fs.copySync("./build", "./dist/switch");
        console.log("Copying emulator files...");
        fs.copyFileSync("./node_modules/modloader64-platform-deps/Windows/emulator.pak", "./dist/windows/emulator_windows.pak");
        process.chdir("./dist/windows");
        child_process.execSync("paker -i ./emulator_windows.pak -o ./");
        process.chdir(original_dir);
        fs.copyFileSync("./node_modules/modloader64-platform-deps/Linux/emulator.pak", "./dist/linux/emulator_linux.pak");
        process.chdir("./dist/linux");
        child_process.execSync("paker -i ./emulator_linux.pak -o ./");
        process.chdir(original_dir);
        if (fs.existsSync("./dist/windows/emulator_windows.pak")) {
            fs.unlinkSync("./dist/windows/emulator_windows.pak");
        }
        if (fs.existsSync("./dist/linux/emulator_linux.pak")) {
            fs.unlinkSync("./dist/linux/emulator_linux.pak");
        }
        console.log("Building paks...");
        process.chdir("./dist");
        fs.renameSync("./windows", "./ModLoader");
        child_process.execSync("paker --dir ./ModLoader --output ./");
        fs.renameSync("./ModLoader.pak", "./Windows.pak");
        let zipFile: zip = new zip();
        zipFile.addLocalFolder("./ModLoader", "./ModLoader");
        zipFile.writeZip("./ModLoader-win32.zip");
        fs.removeSync("./ModLoader");
        fs.renameSync("./linux", "./ModLoader");
        child_process.execSync("paker --dir ./ModLoader --output ./");
        fs.renameSync("./ModLoader.pak", "./Linux.pak");
        let zipFile2: zip = new zip();
        zipFile2.addLocalFolder("./ModLoader", "./ModLoader");
        zipFile2.writeZip("./ModLoader-linux64.zip");
        fs.removeSync("./ModLoader");
        process.chdir(original_dir);
        console.log("Building dedi tarball...");
        fs.copySync("./build", "./dist/dedi");
        process.chdir("./dist/dedi");
        child_process.execSync("tar -zcvf ./ModLoader64-server.tar.gz .");
        process.chdir(original_dir);
        fs.copyFileSync("./dist/dedi/ModLoader64-server.tar.gz", "./dist/ModLoader64-server.tar.gz");
        process.chdir("./dist");
        child_process.execSync("paker --dir ./dedi --output ./");
        process.chdir(original_dir);
        fs.removeSync("./dist/dedi");
        fs.copyFileSync("./update.json", "./dist/update.json");
    });
}

function pushToServer() {
    let Client = require('ssh2-sftp-client');
    let sftp = new Client();
    sftp.connect({
        host: fs.readFileSync('./addr.bin').toString(),
        port: '22',
        username: fs.readFileSync("./user.bin").toString(),
        password: fs.readFileSync("./pw.bin").toString()
    }).then(() => {
        console.log("connected.");
        return sftp.list('/var/www/html/ModLoader64/dev');
    }).then(data => {
        console.log(data);
        console.log("Updating client files.")
        return sftp.uploadDir("./dist", '/var/www/html/ModLoader64/dev/');
    }).then(data => {
        console.log(data);
        console.log("Updating OotO dev server files.")
        child_process.execSync("paker --input ./dist/dedi.pak --output ./dist");
        return sftp.uploadDir("./dist/dedi", "/OotO_200/dev_server")
    }).then(data => {
        console.log(data);
        sftp.end();
    }).catch(err => {
        console.log(err, 'catch error');
    });
}

function pushToLiveServer() {
    child_process.execSync("paker --input ./dist/dedi.pak --output ./dist");
    fs.readdirSync("./dist/dedi/node_modules").forEach((file: string) => {
        let f = path.resolve("./dist/dedi/node_modules", file);
        if (f.indexOf("modloader64_api") === -1) {
            //console.log("Removing " + file + ".");
            //fs.removeSync(f);
        }
    });
    let Client = require('ssh2-sftp-client');
    let sftp = new Client();
    sftp.connect({
        host: fs.readFileSync('./addr.bin').toString(),
        port: '22',
        username: fs.readFileSync("./user.bin").toString(),
        password: fs.readFileSync("./pw.bin").toString()
    }).then(() => {
        console.log("connected.");
        return sftp.list('/var/www/html/ModLoader64/update');
    }).then(data => {
        console.log(data);
        console.log("Updating OotO server files.")
        return sftp.uploadDir("./dist/dedi", "/OotO_200")
    }).then(data => {
        console.log(data);
        console.log("Updating MMO server files.")
        return sftp.uploadDir("./dist/dedi", "/MMARO")
    }).then(data => {
        console.log(data);
        console.log("Updating BKO server files.")
        return sftp.uploadDir("./dist/dedi", "/ML64_Servers/BKO")
    }).then(data => {
        console.log(data);
        console.log("Updating SM64O server files.")
        return sftp.uploadDir("./dist/dedi", "/ML64_Servers/SM64O")
    }).then(data => {
        console.log(data);
        console.log("Updating Mischief Makers server files.")
        return sftp.uploadDir("./dist/dedi", "/ML64_Servers/Mischief")
    }).then(data => {
        console.log(data);
        fse.removeSync("./dist/dedi");
        fse.removeSync("./dist/dedi.pak");
        console.log("Updating client files.")
        return sftp.uploadDir("./dist", '/var/www/html/ModLoader64/update/');
    }).then(data => {
        console.log(data);
        sftp.end();
    }).catch(err => {
        console.log(err, 'catch error');
    });
}

function prebuild() {

    if (!fs.existsSync("./cores")) {
        fs.mkdirSync("./cores");
    }

    if (!fs.existsSync("./mods")) {
        fs.mkdirSync("./mods");
    }

    if (!fs.existsSync("./roms")) {
        fs.mkdirSync("./roms");
    }

    if (!fs.existsSync("./build")) {
        fs.mkdirSync("./build");
    }

    if (!fs.existsSync("./build/src")) {
        fs.mkdirSync("./build/src");
    }

    if (!fs.existsSync("./build/mods")) {
        fs.mkdirSync("./build/mods");
    }

    if (!fs.existsSync("./build/roms")) {
        fs.mkdirSync("./build/roms");
        if (fs.existsSync("./roms")) {
            fs.copySync("./roms", "./build/roms");
        }
    }

    if (!fs.existsSync("./build/emulator")) {
        if (fs.existsSync("./Mupen64Plus/emulator.tar.gz")) {
            fs.unlink("./Mupen64Plus/emulator.tar.gz");
        }
        fs.copySync("./Mupen64Plus", "./build");
    }
    (async () => {
        const fetch = require('node-fetch');
        console.log("Getting commit data...");
        const response = await fetch('https://api.github.com/repos/hylian-modding/ModLoader64/contributors?anon=1');
        const body = await response.arrayBuffer();
        const buf = Buffer.from(body);
        const j = JSON.parse(buf.toString());
        fs.writeFileSync("./src/contributors1.json", JSON.stringify(j, null, 2));
        console.log("Done.");
    })();
}

function build() {
    fs.copySync("./src", "./build/src");
    fs.copySync("./mods", "./build/mods");
}

function postbuild() {
    findRemoveSync('./src', { extensions: ['.js'] });
    findRemoveSync('./test', { extensions: ['.js'] });
    if (!fs.existsSync("./build2")) {
        fs.mkdirSync("./build2");
    }
}

function sign() {
    recursive("./build", function (err, files) {
        for (let i = 0; i < files.length; i++) {
            let _path = path.resolve(files[i]);
            let _parse = path.parse(files[i]);
            if (_parse.ext === ".js" && _parse.name !== "index" && _parse.name !== "publicKey") {
                let data = fs.readFileSync(_path);
                const private_key = fse.readFileSync('./privateKey.pem', 'utf-8')
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
}

function player2() {
    fs.copySync("./build", "./build2");
    if (fs.existsSync("./build2/ModLoader64-config.json")) {
        let config = JSON.parse(fs.readFileSync("./build2/ModLoader64-config.json", 'utf8'));
        config.ModLoader64.isServer = false;
        config["NetworkEngine.Client"].nickname = "Test";
        fs.writeFileSync("./build2/ModLoader64-config.json", JSON.stringify(config));
    }
}