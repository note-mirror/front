import React, { useState } from 'react'

import {
  Editor,
  EditorState,
} from 'draft-js'

const Component = () => {
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty())

  const onEditorChange = (state) => {
    setEditorState(state)
  }

  return <Editor editorState={ editorState } onChange={ onEditorChange } />;
}

export default Component