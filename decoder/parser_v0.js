'use strict';

/**
 * Survarium options files parser before version 0.46
 */

const ENDIANNESS = require('os').endianness();

function parse(buffer, options) {
	function getLength(entry) {
		return entry.readUInt32LE(0);
	}

	const ENTRY_LENGTH       = getLength(buffer);
	const ENTRY_OFFSET_SIZE  = ENTRY_LENGTH - 2;
	const ENTRY_OFFSET_TYPE  = ENTRY_LENGTH - 4;
	const ENTRY_OFFSET_NAME  = 8;
	const ENTRY_OFFSET_VALUE = 0;

	function correct(entry) {
		return entry && entry.length === ENTRY_LENGTH;
	}

	function getEntry(offset) {
		let entry = buffer.slice(offset, offset + ENTRY_LENGTH);
		if (!correct(entry)) {
			return;
		}
		entry.__offset = offset;
		return entry;
	}

	function getSize(entry) {
		return entry[`readUInt16${ENDIANNESS}`](ENTRY_OFFSET_SIZE);
	}

	function getType(entry) {
		return entry[`readUInt16${ENDIANNESS}`](ENTRY_OFFSET_TYPE);
	}

	function getString(offset, size) {
		let stringEnd =  buffer.indexOf(0, offset, 'hex');
		stringEnd === -1 && size && (stringEnd = size);
		return buffer.slice(offset, stringEnd).toString('utf8');
	}

	function getNameOffset(entry) {
		return entry[`readUInt32${ENDIANNESS}`](ENTRY_OFFSET_NAME);
	}

	function getName(entry, parent) {
		let name = getString(getNameOffset(entry));

		if (name === '\u0018') {
			name = parent ?
				options.longNames ? `${parent.name}_${parent.value.length}` :
					parent.value.length :
				'root';
		}

		return name;
	}

	function getValueInt(entry) {
		return entry[`readInt32${ENDIANNESS}`](ENTRY_OFFSET_VALUE);
	}

	function getValueFloat(entry, shift) {
		let offset = ENTRY_OFFSET_VALUE;
		shift && (offset += shift);
		return Math.round(entry[`readFloat${ENDIANNESS}`](offset) * 10000) / 10000;
	}

	function getValueString(entry, size) {
		return getString(entry[`readUInt32${ENDIANNESS}`](ENTRY_OFFSET_VALUE), size);
	}

	function getValueBool(entry) {
		return !!entry[`readInt32${ENDIANNESS}`](ENTRY_OFFSET_VALUE);
	}

	function getChild(entry) {
		return getEntry(getValueInt(entry));
	}

	function getArray(entry) {
		let offset = getValueInt(entry);
		let value = buffer.slice(offset, offset + ENTRY_LENGTH);
		let array = [];
		let size = getSize(entry);
		for (var i = 0; i < size; i += 4) {
			array.push(getValueFloat(value, i));
		}
		return array;
	}

	function stringifyBuffer(entry) {
		let result = entry.toString('hex').toUpperCase();
		let length = result.length;
		let out    = '';
		for (let i = 0, j = 2; i < length; i += j) {
			out += (i ? '-' : '') + result.substr(i, j);
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
			name: getName(entry, parent)
		};

		options.debug && (decoded.buffer = stringifyBuffer(entry));

		switch (type) {
			case 0:
				type          = 'bool';
				decoded.value = getValueBool(entry);
				break;
			case 1:
				type          = 'int';
				decoded.value = getValueInt(entry);
				break;
			case 2:
				type          = 'float';
				decoded.value = getValueFloat(entry);
				break;
			case 3:
			case 4:
				let safe      = decoded.size - 1;
				let __pointer = pointer;

				decoded.value   = [];
				pointer         = decoded.value;
				let innerOffset = getChild(entry).__offset;

				do {
					let child = getEntry(innerOffset);
					decode(child, decoded);
					innerOffset += ENTRY_LENGTH;
				} while (safe-- && decoded.value.length < decoded.size);

				if (!options.full) {
					decoded.value = decoded.value.reduce((hash, elem) => {
						hash[elem.name] = elem.value;
						return hash;
					}, type === 3 ? {} : []);
				}

				pointer = __pointer;
				break;
			case 5:
				type          = 'string';
				decoded.value = getValueString(entry, decoded.size);
				break;
			case 6:
			case 7:
			case 8:
				decoded.size = type - 4;
				type = `arr`;
				decoded.value = getArray(entry);
				break;
			default:
				decoded.value = 'UNKNOWN';
				break;
		}

		decoded.type = type;

		if (!options.debug && !options.full) {
			decoded = { name: decoded.name, value: decoded.value };
		}

		if (!options.debug && options.full && options.format && options.format.length) {
			decoded = options.format.reduce((formatted, field) => {
				formatted[field] = decoded[field];
				return formatted;
			}, {});
		}

		return pointer.push(decoded);
	}

	decode(getEntry(0));

	return (!options.debug && !options.full) ? result[0].value : result;
}

module.exports = parse;
