const { readdir, readFile, writeFile } = require("fs/promises")
const { join } = require("path")

let eu = 0, na = 0, good = 0, idk = 0

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
        const newContent = content.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g, (_, a, b, year) => {
            if (a > 12)  {
                eu++
                return `${year}-${(+b+"").padStart(2, "0")}-${a}`
            }
            if (b > 12)  {
                na++
                return `${year}-${(+a+"").padStart(2, "0")}-${b}`
            }
            if (+a == +b) {
                good++
                return `${year}-${(+a+"").padStart(2, "0")}-${(+b+"").padStart(2, "0")}`
            }
            idk++
            return `${year}-${(+a+"").padStart(2, "0")}-${(+b+"").padStart(2, "0")} TODO_CHECK_MANUALLY`
        })
        await writeFile(path, newContent)
    }
}

async function main() {
    console.log("Scanning TCL...")
    await parseDir("../../TCL")
    console.log({
        na, eu, good, idk
    })
}
main()