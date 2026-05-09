/**
 * One-off: node scripts/convert-grabble-prompt-library.mjs <path-to.jsonl>
 * Defaults to user's Downloads path when no arg.
 */
import fs from "node:fs"
import path from "node:path"

const defaultInput = path.join(
  process.env.USERPROFILE || process.env.HOME || "",
  "Downloads",
  "grabble_prompt_library_v1.jsonl"
)
const input = process.argv[2] || defaultInput
const outDir = path.join(process.cwd(), "grabble", "src", "data")

const raw = fs.readFileSync(input, "utf8")
const lines = raw
  .split(/\n/)
  .map((l) => l.trim())
  .filter(Boolean)

const rows = lines.map((line, i) => {
  try {
    return JSON.parse(line)
  } catch {
    throw new Error(`Invalid JSON on line ${i + 1}`)
  }
})

const faremons = {
  libraryVersion: "v1-jsonl-converted",
  sourceFile: path.basename(input),
  creatureTemplate: null,
  creatures: [],
}

const arenas = {
  libraryVersion: "v1-jsonl-converted",
  sourceFile: path.basename(input),
  arenaTemplate: null,
  arenas: [],
}

const commentary = {
  libraryVersion: "v1-jsonl-converted",
  sourceFile: path.basename(input),
  globalStyleSpec: null,
  negativePrompt: null,
  batchCommandRule: null,
  uiTemplate: null,
  uiBrandAssets: [],
}

for (const row of rows) {
  if (row.row_type === "creature_template") {
    faremons.creatureTemplate = row
    continue
  }
  if (row.row_type === "arena_template") {
    arenas.arenaTemplate = row
    continue
  }
  if (row.row_type === "global_style_spec") {
    commentary.globalStyleSpec = row
    continue
  }
  if (row.row_type === "negative_prompt") {
    commentary.negativePrompt = row
    continue
  }
  if (row.row_type === "batch_command_rule") {
    commentary.batchCommandRule = row
    continue
  }
  if (row.row_type === "ui_template") {
    commentary.uiTemplate = row
    continue
  }
  if (row.row_type === "asset_prompt" && row.category === "creature") {
    faremons.creatures.push(row)
    continue
  }
  if (row.row_type === "asset_prompt" && row.category === "arena") {
    arenas.arenas.push(row)
    continue
  }
  if (row.row_type === "asset_prompt" && row.category === "ui_brand_asset") {
    commentary.uiBrandAssets.push(row)
    continue
  }
  throw new Error(`Unhandled row: ${row.id} ${row.row_type} ${row.category}`)
}

fs.mkdirSync(outDir, { recursive: true })
const write = (name, obj) => {
  fs.writeFileSync(
    path.join(outDir, name),
    JSON.stringify(obj, null, 2) + "\n",
    "utf8"
  )
}
write("faremons.json", faremons)
write("arenas.json", arenas)
write("commentary.json", commentary)

console.log("Wrote:", path.join(outDir, "faremons.json"))
console.log("Wrote:", path.join(outDir, "arenas.json"))
console.log("Wrote:", path.join(outDir, "commentary.json"))
console.log(
  `counts: creatures=${faremons.creatures.length} arenas=${arenas.arenas.length} ui=${commentary.uiBrandAssets.length}`
)
