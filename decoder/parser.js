'use strict';

function parse(buffer, options) {
	function getLength(entry) {
		return entry.readUInt32LE(0);
	}

	const entryLength = getLength(buffer);
	const entrySizeOffset = entryLength - 2;
	const entryTypeOffset = entryLength - 4;
	const entryNameOffset = 8;
	const entryValueOffset = 0;

	function correct(entry) {
		return entry && entry.length === entryLength;
	}

	function getEntry(offset) {
		let entry = buffer.slice(offset, offset + entryLength);
		if (!correct(entry)) {
			return;
		}
		entry.__offset = offset;
		return entry;
	}

	function getSize(entry) {
		return entry.readUInt16LE(entrySizeOffset);
	}

	function getType(entry) {
		return entry.readUInt16LE(entryTypeOffset);
	}

	function getString(offset, size) {
		return buffer.slice(offset, buffer.indexOf(0, offset, 'hex') || size).toString('utf8');
	}

	function getNameOffset(entry) {
		return entry.readUInt32LE(entryNameOffset);
	}

	function getName(entry, parent) {
		let name = getString(getNameOffset(entry));

		if (name === '\u0018') {
			name = parent ? `${parent.name}_${parent.value.length}` : 'root';
		}

		return name;
	}

	function getValueInt(entry) {
		return entry.readUInt32LE(entryValueOffset);
	}

	function getValueFloat(entry) {
		return Math.round(entry.readFloatLE(entryValueOffset) * 100) / 100;
	}

	function getValueString(entry, size) {
		return getString(entry.readUInt16LE(entryValueOffset), size);
	}

	function getValueBool(entry) {
		return !!entry.readUInt16LE(entryValueOffset);
	}

	function getNext(entry) {
		return getEntry(getValueInt(entry));
	}

	function stringifyBuffer(entry) {
		let result = entry.toString('hex').toUpperCase();
		let length = result.length;
		let out = '';
		for (let i = 0, j = 2; i < length; i += j) {
			out += (i ? '-' : '') + result.substr(i, j)
		}
		return out;
	}

	const result = [];

	let pointer = result;

	function decode(entry, parent) {
		if (!entry) {
			return;
		}

		let type = getType(entry);

		let decoded = {
			size: getSize(entry),
			name: getName(entry, parent),
		};

		options.debug && (decoded.buffer = stringifyBuffer(entry));

		switch (type) {
			case 0:
				type = 'bool';
				decoded.value = getValueBool(entry);
				break;
			case 1:
				type = 'int';
				decoded.value = getValueInt(entry);
				break;
			case 2:
				type = 'float';
				decoded.value = getValueFloat(entry);
				break;
			case 3:
			case 4:
				let safe = 0;
				let __pointer = pointer;

				decoded.value = [];
				pointer = decoded.value;
				let innerOffset = getNext(entry).__offset;

				do {
					let child = getEntry(innerOffset);
					decode(child, decoded);
					innerOffset += entryLength;
				} while (++safe < decoded.size && decoded.value.length < decoded.size);

				pointer = __pointer;
				break;
			case 5:
				type = 'string';
				decoded.value = getValueString(entry, decoded.size);
				break;
			default: return;
		}

		decoded.type = type;

		return pointer.push(decoded);
	}

	decode(getEntry(0));

	return result;
}

module.exports = parse;
