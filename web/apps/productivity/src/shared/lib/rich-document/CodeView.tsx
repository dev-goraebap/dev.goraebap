import {DocumentSelect} from './DocumentSelect';
import {NodeViewWrapper,NodeViewContent,type NodeViewProps} from '@tiptap/react';
import {closeHistory} from '@tiptap/pm/history';
import {Code2} from './icons';
import {BlockCopy,useEditable} from './block-ui';
import {languages} from './component-nodes';
export function CodeView({node,editor,updateAttributes}:NodeViewProps){
 const editable=useEditable(editor),language=node.attrs.language??'plaintext',label=languages.find(([value])=>value===language)?.[1]??language;
 return <NodeViewWrapper className="doc-code" data-code-block="" data-language={language} data-block-id={node.attrs.blockId}>
  <div className="doc-block-header" contentEditable={false}><span className="doc-block-label"><Code2 size={14}/>{editable?<DocumentSelect label="코드 언어" value={language} onChange={value=>{editor.view.dispatch(closeHistory(editor.state.tr));updateAttributes({language:value});editor.view.dispatch(closeHistory(editor.state.tr));editor.commands.focus();}} options={[...(!languages.some(([value])=>value===language)?[{value:language,label:language}]:[]),...languages.map(([value,label])=>({value,label}))]}/>:<span>{label}</span>}</span><BlockCopy text={node.textContent} label="코드 복사"/></div>
  <pre spellCheck={false}><NodeViewContent<'code'> as="code"/></pre>
 </NodeViewWrapper>;
}
