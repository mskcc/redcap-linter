export function _resolve(path, obj, separator='.') {
	let properties = Array.isArray(path) ? path : path.split(separator)
	return properties.reduce((prev, curr) => prev && prev[curr], obj)
}