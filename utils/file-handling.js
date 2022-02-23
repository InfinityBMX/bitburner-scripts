export const outputResultsToFile = async (ns, filename, command) => {
	await ns.write(filename, JSON.stringify({ ...command(), timestamp: Date.now()}), 'w');
}

export const persistObject = async (ns, object, filename) => {
	await ns.write(filename, JSON.stringify({...object, timestamp: Date.now()}), 'w');
}

export const getFileContents = async (ns, filename) => {
	if (ns.fileExists(filename)){
		return JSON.parse(await ns.read(filename))
	}
	return null;
}