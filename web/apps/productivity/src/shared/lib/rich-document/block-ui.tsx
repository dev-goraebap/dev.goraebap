import {useEffect,useState} from 'react';
import type {Editor} from '@tiptap/core';

export function useEditable(editor:Editor){
 const [editable,setEditable]=useState(editor.isEditable);
 useEffect(()=>{const update=()=>setEditable(editor.isEditable);editor.on('transaction',update);editor.on('update',update);update();return()=>{editor.off('transaction',update);editor.off('update',update);};},[editor]);
 return editable;
}
export {BlockCopy} from './BlockCopy';

