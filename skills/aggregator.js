'use strict';

function getType(tree) {
	return tree.ui.postfix && tree.ui.postfix.match(/^st_(\w+)_\w+$/) && RegExp.$1;
}

function getId(tree) {
	return tree.id;
}

function getMods(tree, type) {
	let mods = tree.modifiers;
	if (!mods) {
		return;
	}

	return mods.reduce((result, mod) => {
		Object.keys(mod).forEach(modName => {
			let modVals = (result[modName] || (result[modName] = []));
			let modVal = mod[modName];

			if (type === 'percent') {
				modVal *= 100;
			}

			if (modVals.length) {
				modVal += modVals[modVals.length - 1];
			}

			modVals.push(modVal);
		});

		return result;
	}, {});
}

function getBranch(tree) {
	switch (getId(tree).toString()[0]) {
		case '1': return 'shooting';
		case '2': return 'physical';
		case '5': return 'anomaly';
		default: return;
	}
}

function aggregate(skills, params) {
	let locales = params.locales;

	function getLocale(key) {
		return locales.reduce((result, lang) => {
			result[lang.locale] = lang.data[key];
			return result;
		}, {});
	}

	return skills['skills_tree'].reduce((result, tree) => {
		let branch = getBranch(tree);

		if (!branch) {
			return;
		}

		let ui = tree.ui;
		let type = getType(tree);
		let id = getId(tree);

		result[id] = {
			pos: ui.position,
			branch :branch,
			name: getLocale(ui.name),
			icon: ui.icon,
			description: getLocale(ui.description),
			type: type,
			sign: ui.sign || undefined,
			mods: getMods(tree, type)
		};

		return result;
	}, {});
}

module.exports = aggregate;
