const fetch = require("node-fetch")
const child = require("child_process")
const { read, write } = require("clipboardy")

async function main() {
    console.log("Checking working directory...")
    const { stdout, stderr } = await run("git", ["remote", "-v"])
    if (stderr.length > 0) return

    const artesians = stdout.trim().split("\n").find(x => x.includes("Artesians/TCL")).split(/\s+/)[0]
    const own = stdout.trim().split("\n").find(x => !x.includes("Artesians/TCL")).split(/\s+/)[0]

    console.log(`Artesians at '${artesians}', personal at '${own}'`)
    console.log()
    console.log(`Waiting for link...`)

    while (true) {
        let clipboard = ""
        try {
            clipboard = await read()
        } catch (error) {
            await sleep(100)
            continue
        }

        const url = clipboard

        if (!url.startsWith("https://tickets.deeznuts.moe/")) {
            await sleep(100)
            continue
        }

        const slug = (new URL(url)).pathname.split("/").pop()
        const data = await (await fetch(`https://tickets.deeznuts.moe/api/transcripts/template?slug=${slug}`)).json()

        const channel = data.transcript.channelName
        console.log(`Creating branch '${channel}' from '${artesians}/master' and setting up '${own}' as remote...`)

        await run("git", ["fetch", artesians])
        await run("git", ["checkout", "-b", channel, `${artesians}/master`])
        await run("git", ["push", "-u", own, channel])

        await write(data.md)
        console.log(`:wicked: paste evidence stuff first`)
        console.log(`Create PR link: https://github.com/Tibowl/TCL/pull/new/${channel}`)

        await sleep(10000)
    }
}

async function sleep(time) {
    await new Promise(resolve => setTimeout(resolve, time))
}

async function run(command, opts) {
    return await new Promise((resolve) => {
        const sub = child.spawn(command, opts)
        let stdout = "", stderr = ""
        sub.stdout.on("data", (info) => {
            const str = info.toString()
            for (const line of str.trim().split("\n"))
                console.log(`[${command} 0] ${line}`)
            stdout += str
        })
        sub.stdout.on("end", () => resolve({ stdout, stderr }))

        sub.stderr.on("data", (info) => {
            const str = info.toString()
            for (const line of str.trim().split("\n"))
                console.log(`[${command} 1] ${line}`)
            stderr += str
        })
    })
}
main()

