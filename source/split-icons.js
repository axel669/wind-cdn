import fs from "node:fs/promises"

import opentype from "opentype.js"
import { toWoff } from "woff-tools"
import sort from "@axel669/array-sort"

const buffer = await fs.readFile("source/tabler-icons-3.34.0.woff")
const font = opentype.parse(buffer.buffer)

const glyfList = Array.from(
    font.glyphs,
    (_, i) => {
        const g = font.glyphs.glyphs[i]
        return new opentype.Glyph({
            name: g.name,
            unicode: g.unicode,
            advanceWidth: g.advanceWidth,
            xMin: g.xMin,
            xMax: g.xMax,
            yMin: g.yMin,
            yMax: g.yMax,
            path: g.path
        })
    }
).filter(
    glyf => glyf.unicode > 1000
).sort(
    sort.prop(".name", sort.string)
)

glyfList.find(glyf => glyf.name === "x").unicode = 60245
glyfList.find(glyf => glyf.name === "x").unicodes = [60245]

const alphabet = [
    ...Array.from({ length: 10 }, (_, i) => "0".charCodeAt(0) + i),
    ...Array.from({ length: 26 }, (_, i) => "a".charCodeAt(0) + i),
    "_".charCodeAt(0),
    "-".charCodeAt(0),
].map(
    code => new opentype.Glyph({
        name: String.fromCharCode(code),
        unicode: code,
        path: new opentype.Path(),
        advanceWidth: 5,
    })
)

const notdef = new opentype.Glyph({
    name: ".notdef",
    path: new opentype.Path(),
    advanceWidth: 5,
})

const saveIcon = async (filename, glyf) => {
    const chars = glyf.name.split("")
    const fontGlyfs = [
        notdef,
        ...alphabet.filter(
            aglyf => chars.includes(aglyf.name) === true
        ),
        glyf
    ]

    const newfont = new opentype.Font({
        familyName: "TablerLigatures",
        styleName: "Medium",
        unitsPerEm: 1000,
        ascender: 900,
        descender: -100,
        glyphs: fontGlyfs
    })

    const sub = chars.map(
        c => fontGlyfs.findIndex(
            g => g.name === c
        )
    )
    const by = fontGlyfs.indexOf(glyf)
    newfont.substitution.add(
        `liga`,
        { sub, by }
    )

    const iconFontBuffer = toWoff(
        Buffer.from(
            newfont.toArrayBuffer()
        )
    )

    await fs.writeFile(filename, iconFontBuffer)
}

let count = 0
for (const glyf of glyfList) {
    count += 1
    console.log(`creating: ${count}/${glyfList.length} ${glyf.name}`)
    await saveIcon(`cdn/static/icon/${glyf.name}.woff`, glyf)
}
