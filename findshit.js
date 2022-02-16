/** @param {NS} ns **/
const specialHostnames = ['CSEC','I.I.I.I','avmnite-02h','run4theh111z','w0r1d_d43m0n'];

export async function main(ns) {
    let serverChecked = {};
    let checkList = [];
    checkList.push("home");
    serverChecked["home"] = { parent: null };

    while (checkList.length) {
        let server = checkList.shift();
        let edges = ns.scan(server);
        if (specialHostnames.includes(server)) {
            ns.tprint(`${server} found!`);
        }

        for (let i = 0; i < edges.length; i++) {
            if (!serverChecked[edges[i]]) {
                serverChecked[edges[i]] = { parent: server };
                checkList.push(edges[i]);
            }
        }
    }

	for ( const special of specialHostnames ) {
		if (serverChecked[special]) {
			let path = [];
			path.push(special);
			let next = serverChecked[special].parent;
			while (next) {
				path.push(next);
				next = serverChecked[next].parent;
			}
			ns.tprint(path.reverse().map(s => `connect ${s};`).join(''));
		} else {
			ns.tprint(`${special} not found`);
		}
	}
    //return Object.keys(serverChecked);
}