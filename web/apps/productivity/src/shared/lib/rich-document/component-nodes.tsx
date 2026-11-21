import {ReactNodeViewRenderer} from '@tiptap/react';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import {common,createLowlight} from 'lowlight';
import {Info,Lightbulb,CheckCircle2,TriangleAlert,OctagonAlert,NotebookPen} from './icons';
import {MediaNodeView} from './media-node';
import {Callout} from './schema';

export const tones=[{value:'gray',label:'메모',icon:NotebookPen},{value:'info',label:'정보',icon:Info},{value:'tip',label:'팁',icon:Lightbulb},{value:'success',label:'확인',icon:CheckCircle2},{value:'warning',label:'주의',icon:TriangleAlert},{value:'danger',label:'경고',icon:OctagonAlert}];
;
import {CalloutView} from './CalloutView';
export const languages=[['plaintext','일반 텍스트'],['typescript','TypeScript'],['javascript','JavaScript'],['python','Python'],['bash','Shell'],['json','JSON'],['xml','HTML'],['css','CSS'],['sql','SQL'],['java','Java']];
;
import {CodeView} from './CodeView';
export const lowlight=createLowlight(common);
export const componentNodeViews=[MediaNodeView,Callout.extend({addNodeView(){return ReactNodeViewRenderer(CalloutView);}}),CodeBlockLowlight.configure({lowlight,defaultLanguage:'plaintext'}).extend({addNodeView(){return ReactNodeViewRenderer(CodeView);}})];
