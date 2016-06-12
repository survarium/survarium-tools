#!/usr/bin/env node

'use strict';

const fs     = require('fs');
const path   = require('path');
const mkdirp = require('mkdirp');
const yargs  = require('yargs')
	.usage('$0 [args]')
	.options({
		file  : {
			describe: 'Path to skills.json file',
			type    : 'string'
		},
		localization: {
			describe: 'Path to folder with localization json files',
			type    : 'string'
		},
		dst   : {
			describe: 'Output destination folder',
			type    : 'string',
			default : path.join(process.cwd(), 'out')
		},
		debug : {
			describe: 'Debug mode',
			type    : 'boolean'
		},
		locales: {
			describe: 'List of localizations',
			type    : 'array',
			default : ['russian', 'ukrainian', 'english']
		}
	})
	.help('help');

const aggregator = require('./aggregator');

function parse(file, dst, options) {
	options.debug && (console.log(`processing ${file.base}`));
	file.body = aggregator(require(file.path), options);
	save(dst, file);
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
	let localizationSrc = argv.localization;

	if (!localizationSrc) {
		return console.error(`Error: no valid source localization folder set. Run with --help.`);
	}

	let shortLangs = {
		russian: 'ru',
		english: 'en',
		ukrainian: 'ua',
		french: 'fr',
		german: 'de',
		polish: 'pl',
		spanish: 'sp'
	};

	let locales = argv.locales.map(locale => {
		return { locale: shortLangs[locale] || locale, data: require(`${localizationSrc}/${locale}/localization.json`).strings };
	});

	let options = {
		debug : argv.debug,
		locales: locales
	};

	let input;
	if (input = argv.file) {
		let file  = path.parse(input);
		file.path = input;
		return parse(file, dst, options);
	} else {
		return console.error(`Error: no valid sources provided. Run with --help.`);
	}
})(yargs);
