const { readdir, readFile } = require("fs/promises")
const { join } = require("path")

const stuff = []
async function parseDir(dir) {
    for (const file of await readdir(dir, { withFileTypes: true })) {
        const path = join(dir, file.name)

        if (file.isDirectory()) {
            await parseDir(path)
            continue
        }

        if (!file.name.toLowerCase().endsWith(".md"))
            continue

        const content = (await readFile(path)).toString()
        const matches = content.match(/#+\s*(.*)\s+\**By:*\**:*\s*(.*?)\s*\**Added:*\**:* (\d{4}-\d\d-\d\d)/g)
        if (matches)
            for (const match of matches) {
                const [_, title, user, date] = match.match(/#+\s*(.*)\s+\**By:*\**:*\s*(.*?)\s*\**Added:*\**:* (\d{4}-\d\d-\d\d)/)
                stuff.push({ title, user, date, path })
            }
    }
}

async function main() {
    let [_p, _e, startDate] = process.argv

    if (startDate == undefined) {
        console.log(`Usage: node newsletter [date]`)
        console.log(`Example: node newsletter 2022-06-01`)
        return
    }

    console.log("Scanning TCL...")
    await parseDir("../TCL")
    console.log(`| Date | Entry | Author\(s\) |
| :--- | :--- | :--- |`)
    console.log(
        stuff
            .filter(a => new Date(a.date).getTime() > new Date(startDate).getTime())
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(({ date, title, user, path }) => `| ${new Date(date).toLocaleString("en-us", { day: "numeric", month: "long" })} | [${title.trim()}](${path.replace(/\\/g, "/").replace("/TCL/", "/")}#${title.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z-]/g, "")}) | ${user.trim()} |`)
            .join("\n")
    )
}
main()