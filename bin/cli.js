#!/usr/bin/env node
const program = require("commander");
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const amdtoes6 = require("../index");

program
    .option("--src <dirname>", "Directory of the source files")
    .option("--dest <dirname>", "Directory of the destination files")
    .option("--glob [glob]", "Glob pattern for the src")
    .option("--recursive", "Set glob pattern to **/*.js with no hassle")
    .option("--replace", "Replace the input files with results")
    .option("--suffix <string>", "Replace suffix of the files")
    .option("--beautify", "Beautify the output")
    .parse(process.argv);

function replaceSuffix (filename, suffix) {
    return suffix ? filename.replace(/\.js$/, "." + suffix) : filename;
}

function getGlob (options) {
    if (options.recursive) {
        return "**/*.js";
    }
    return program.glob || "*.js";
}

function convertFile (file, options) {
    var filepath = path.join(process.cwd(), file);
    var content = fs.readFileSync(filepath, "utf8");
    var compiled = amdtoes6(content, options);
    if (program.replace) {
        var destpath = replaceSuffix(filepath, program.suffix);
        if (program.suffix) {
            fs.unlinkSync(filepath);
        }
        fs.writeFileSync(destpath, compiled);
    } else {
        process.stdout.write(compiled);
    }
}

function convertFiles (files, options) {
    files.forEach(function (file) {
        var filepath = path.join(program.src, file);
        var content = fs.readFileSync(filepath, "utf8");
        var compiled = amdtoes6(content, options);
        var destpath = program.replace ? filepath : path.join(program.dest, file);
        if (program.suffix) {
            fs.unlinkSync(filepath);
        }
        destpath = replaceSuffix(destpath, program.suffix);
        fs.writeFileSync(destpath, compiled);
    });
}

if (!program.src) {
    var file = program.args[0];
    convertFile(file, program);
    return process.exit(0);
}

if (program.src && (program.dest || program.replace)) {
    var files = glob.sync(getGlob(program), { cwd: program.src });
    convertFiles(files, program);
    return process.exit(0);
}

process.stderr.write("Please provide --src and --dest");
return process.exit(1);