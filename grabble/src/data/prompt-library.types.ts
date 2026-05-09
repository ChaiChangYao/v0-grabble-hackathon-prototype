/** Base row shared across grabble_prompt_library_v1.jsonl records. */
export type GrabblePromptRowType =
  | "global_style_spec"
  | "creature_template"
  | "arena_template"
  | "ui_template"
  | "negative_prompt"
  | "batch_command_rule"
  | "asset_prompt"

export type GrabblePromptCategory =
  | "style"
  | "template"
  | "workflow"
  | "creature"
  | "arena"
  | "ui_brand_asset"

export interface GrabblePromptRecord {
  id: string
  project: string
  version: string
  created_date: string
  row_type: GrabblePromptRowType
  category: GrabblePromptCategory
  asset_name: string
  task: string
  system_prompt: string
  input: string
  output_prompt: string
  negative_prompt?: string
  global_style?: string
  safety_brand_rules?: string
  batch_id?: string
  asset_number?: string | number
  tags?: string[]
}

export interface FaremonPromptAsset extends GrabblePromptRecord {
  row_type: "asset_prompt"
  category: "creature"
}

export interface ArenaPromptAsset extends GrabblePromptRecord {
  row_type: "asset_prompt"
  category: "arena"
}

export interface UiBrandPromptAsset extends GrabblePromptRecord {
  row_type: "asset_prompt"
  category: "ui_brand_asset"
}

export interface FaremonsLibraryFile {
  libraryVersion: string
  sourceFile: string
  creatureTemplate: GrabblePromptRecord | null
  creatures: FaremonPromptAsset[]
}

export interface ArenasLibraryFile {
  libraryVersion: string
  sourceFile: string
  arenaTemplate: GrabblePromptRecord | null
  arenas: ArenaPromptAsset[]
}

export interface CommentaryLibraryFile {
  libraryVersion: string
  sourceFile: string
  globalStyleSpec: GrabblePromptRecord | null
  negativePrompt: GrabblePromptRecord | null
  batchCommandRule: GrabblePromptRecord | null
  uiTemplate: GrabblePromptRecord | null
  uiBrandAssets: UiBrandPromptAsset[]
}
