#!/usr/bin/env node

'use strict';

const fs     = require('fs');
const path   = require('path');
const glob   = require('glob');
const mkdirp = require('mkdirp');
const yargs  = require('yargs')
	.usage('$0 [args]')
	.options({
		file  : {
			describe: 'Path to .options file',
			type    : 'string'
		},
		folder: {
			describe: 'Path to folder with .options files',
			type    : 'string'
		},
		dst   : {
			describe: 'Output destination folder',
			type    : 'string',
			default : path.join(process.cwd(), 'out')
		},
		debug : {
			describe: 'Debug mode: add source HEX to output, etc',
			type    : 'boolean'
		},
		format: {
			describe: 'List of output fields. (name value type size)',
			type    : 'array'
		}
	})
	.help('help');

const parser = require('./parser');

function parse(file, dst, options) {
	options.debug && (console.log(`processing ${file.base}`));
	return fs.readFile(file.path, (err, buffer) => {
		if (err) {
			throw err;
		}
		
		try {
			file.body = parser(buffer, options);
			save(dst, file);
		} catch (err) {
			console.error(`Error while parsing ${file.path}`, err);
		}
	});
}

function save(dst, file) {
	mkdirp(dst, err => {
		if (err) {
			throw err;
		}
		
		return fs.writeFile(path.join(dst, `${file.name}.json`), JSON.stringify(file.body, null, 4), err => {
			if (err) {
				throw err;
			}
		});
	});
}

(yargs => {
	let argv = yargs.argv;
	let dst  = argv.dst;
	
	let options = {
		debug : argv.debug,
		format: argv.format
	};
	
	let input;
	if (input = argv.file) {
		let file  = path.parse(input);
		file.path = input;
		return parse(file, dst, options);
	} else if (argv.folder) {
		let folder = argv.folder;
		input      = path.join(folder, '**', '*.options');
		glob(input, (err, files) => {
			if (err) {
				throw err;
			}
			files.forEach(filePath => {
				let file  = path.parse(filePath);
				let to    = filePath.split(folder);
				to        = to[1] ? path.join(dst, to[1].split(file.base)[0]) : dst;
				file.path = filePath;
				return parse(file, to, options);
			});
		});
		
	} else {
		return console.error(`Error: no valid sources provided. Run with --help.`);
	}
})(yargs);
