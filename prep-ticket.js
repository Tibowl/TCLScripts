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
        const url = await read()

        if (!url.startsWith("https://tickettool.xyz/")) {
            await sleep(100)
            continue
        }

        const discordUrl = (new URL(url)).searchParams.get("url")
        const data = await (await fetch(discordUrl)).text()

        const channel = data.split("\n").find(x => x.startsWith("    Channel: ")).match(/ +Channel: (.*) \(\d+\)/)[1]
        console.log(`Creating branch '${channel}' from '${artesians}/master' and setting up '${own}' as remote...`)

        await run("git", ["fetch"])
        await run("git", ["checkout", "-b", channel, `${artesians}/master`])
        await run("git", ["push", "-u", own, channel])

        try {
            const messages = JSON.parse(data.match(/let messages = (\[.*\]);/)[1])

            let finding = "*Unknown*", evidence = "*Unknown*", significance = "*Unknown*"
            let nick = "Unknown", tag = "????"

            for (const message of messages) {
                const content = message.content
                if (!content) continue

                if (content.match(/(Finding|Theory|Bug|Theory\/Finding\/Bug):/i)) {
                    finding = content
                    evidence = ""
                    significance = ""
                } else if (content.match(/Evidence:/i)) {
                    evidence = content
                    significance = ""
                } else if (content.match(/Significance:/i)) {
                    significance = content
                } else
                    continue

                nick = message.nick
                tag = message.tag
            }

            const date = new Date().toLocaleDateString("en-US", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            })

            const findings = `${finding}

${evidence}

${significance}`
            .replace(/\**(Finding|Theory|Bug|Theory\/Finding\/Bug|Evidence|Significance)\**:\**\s*/gi, (_, a) => `**${a}:**  \n`)
            .replace(/(https?:\/\/.*)(\s)/g, (_, url, w) => `[${getDomain(url)}](${url})${w}`)
            .trim()

            const beautifiedChannel = channel.replace(/-/g, " ").replace(/(^|\s)./g, (a) => a.toUpperCase())
            console.log(beautifiedChannel)

            await write(`### ${beautifiedChannel}

**By:** ${nick}\\#${tag}  
**Added:** ${date}  
[Discussion](${url})

${findings}
`)
            console.log(`:wicked: paste evidence stuff first`)
        } catch (error) {
            console.error(`Couldn't parse messages:`, error)
        }

        await sleep(10000)
    }
}

function getDomain(str) {
    const url = new URL(str)
    if (["youtube.com", "youtu.be"].includes(url.hostname))
        return "YouTube"
    if (["i.imgur.com", "imgur.com"].includes(url.hostname))
        return "Imgur"
    return url.hostname
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

