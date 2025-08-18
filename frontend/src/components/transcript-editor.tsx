'use client'

import React, { useMemo, useState } from 'react'
import { createEditor, Descendant } from 'slate'
import { Slate, Editable, withReact } from 'slate-react'

interface ParagraphElement {
  type: 'paragraph'
  children: { text: string }[]
}

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: 'Transcript editing placeholder. This will be enhanced with full transcript editing capabilities.' }],
  } as ParagraphElement,
]

export function TranscriptEditor() {
  const editor = useMemo(() => withReact(createEditor()), [])
  const [value, setValue] = useState<Descendant[]>(initialValue)

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2">Transcript Editor</h3>
      <Slate 
        editor={editor} 
        initialValue={initialValue} 
        onValueChange={(newValue) => setValue(newValue)}
      >
        <Editable
          placeholder="Enter transcript content here..."
          className="min-h-32 p-2 border border-gray-200 rounded"
        />
      </Slate>
    </div>
  )
}