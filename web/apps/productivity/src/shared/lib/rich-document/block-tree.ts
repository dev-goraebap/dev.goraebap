import {Fragment,type Node as ProseNode} from '@tiptap/pm/model';
import {TextSelection,type EditorState,type Transaction} from '@tiptap/pm/state';
import {closeHistory} from '@tiptap/pm/history';

export type TreeBlock={id:string;pos:number;node:ProseNode;parentId:string;index:number;ancestors:string[]};
export type BlockContainer={id:string;pos:number;node:ProseNode;ownerId?:string;label:string};
export type Destination={containerId:string;anchorId?:string;side?:'before'|'after'};
export type BlockTree={blocks:TreeBlock[];containers:BlockContainer[]};

/** Only document-level blocks and children of user-facing block containers are movable.
 * Table cells/list items keep their own editing semantics; summaries/columns are structure. */
export function blockTree(doc:ProseNode):BlockTree{
 const blocks:TreeBlock[]=[],containers:BlockContainer[]=[];
 const visit=(parent:ProseNode,pos:number,id:string,ancestors:string[],label:string,ownerId?:string)=>{
  containers.push({id,pos,node:parent,label,ownerId});
  parent.forEach((node,offset,index)=>{
   const at=pos+1+offset,blockId=node.attrs.blockId;if(!blockId)return;
   blocks.push({id:blockId,pos:at,node,parentId:id,index,ancestors});
   if(node.type.name==='toggle')node.forEach((child,childOffset)=>{if(child.type.name==='toggleBody'&&child.attrs.blockId)visit(child,at+1+childOffset,child.attrs.blockId,[...ancestors,blockId],`토글: ${node.firstChild?.textContent||'제목 없음'}`,blockId);});
   if(node.type.name==='columns')node.forEach((column,columnOffset,columnIndex)=>{if(column.attrs.blockId)visit(column,at+1+columnOffset,column.attrs.blockId,[...ancestors,blockId],`열 배치 ${blocks.filter(b=>b.node.type.name==='columns').length} · ${columnIndex+1}열`,blockId);});
   if(node.type.name==='callout')visit(node,at,blockId,[...ancestors,blockId],`콜아웃: ${node.textContent.slice(0,25)||'빈 내용'}`,blockId);
  });
 };
 visit(doc,-1,'root',[],'문서 맨 아래');return {blocks,containers};
}
export function selectionRoots(tree:BlockTree,ids:string[]):TreeBlock[]{const chosen=new Set(ids);return tree.blocks.filter(block=>chosen.has(block.id)&&!block.ancestors.some(id=>chosen.has(id)));}
export function destinationError(tree:BlockTree,ids:string[],destination:Destination):string|null{
 const roots=selectionRoots(tree,ids),container=tree.containers.find(c=>c.id===destination.containerId);
 if(!roots.length||!container)return '이동할 블록이나 위치를 찾을 수 없습니다.';
 if(roots.some(block=>container.id===block.id||(container.pos>=block.pos&&container.pos<block.pos+block.node.nodeSize)))return '블록을 자기 자신이나 하위 내용 안으로 옮길 수 없습니다.';
 if(destination.anchorId){const anchor=tree.blocks.find(b=>b.id===destination.anchorId&&b.parentId===container.id);if(!anchor)return '이동 위치가 바뀌었습니다. 다시 선택하세요.';if(roots.some(root=>root.id===anchor.id))return '선택한 블록 위에는 놓을 수 없습니다.';}
 return null;
}
/** Build a single native history transaction. IDs are resolved again after deletion,
 * so cross-parent moves never use positions from the previous tree. */
export function blockMove(state:EditorState,ids:string[],destination:Destination):{transaction?:Transaction;ids:string[];error?:string}{
 const tree=blockTree(state.doc),roots=selectionRoots(tree,ids),error=destinationError(tree,ids,destination);
 if(error)return {ids:roots.map(b=>b.id),error};
 if(roots.every(b=>b.parentId==='root')&&roots.length===state.doc.childCount&&destination.containerId==='root')return {ids:roots.map(b=>b.id)};
 let tr=closeHistory(state.tr);
 for(const block of [...roots].reverse())tr=tr.delete(block.pos,block.pos+block.node.nodeSize);
 const after=blockTree(tr.doc),container=after.containers.find(c=>c.id===destination.containerId);
 if(!container)return {ids:[],error:'이동 위치를 찾을 수 없습니다.'};
 const fragment=Fragment.fromArray(roots.map(b=>b.node));
 let insert=container.pos+1+container.node.content.size;
 if(destination.anchorId){const anchor=after.blocks.find(b=>b.id===destination.anchorId);if(!anchor)return {ids:[],error:'이동 위치가 바뀌었습니다.'};insert=anchor.pos+(destination.side==='after'?anchor.node.nodeSize:0);}
 const placeholder=container.node.childCount===1&&container.node.firstChild?.type.name==='paragraph'&&container.node.firstChild.content.size===0;
 if(placeholder){if(!container.node.canReplace(0,1,fragment))return {ids:[],error:'이 위치에는 선택한 블록을 넣을 수 없습니다.'};tr=tr.replaceWith(container.pos+1,container.pos+1+container.node.content.size,fragment);}
 else{const index=tr.doc.resolve(insert).index();if(!container.node.canReplace(index,index,fragment))return {ids:[],error:'이 위치에는 선택한 블록을 넣을 수 없습니다.'};tr=tr.insert(insert,fragment);}
 // A closed toggle opens as part of the same reversible move, never during hover.
 const updated=blockTree(tr.doc);const target=updated.containers.find(c=>c.id===destination.containerId);
 if(target?.ownerId){const owner=updated.blocks.find(b=>b.id===target.ownerId);if(owner?.node.type.name==='toggle'&&!owner.node.attrs.open)tr=tr.setNodeMarkup(owner.pos,undefined,{...owner.node.attrs,open:true});}
 const first=blockTree(tr.doc).blocks.find(b=>b.id===roots[0].id);if(first)tr=tr.setSelection(TextSelection.near(tr.doc.resolve(first.pos+1)));
 if(tr.doc.eq(state.doc))return {ids:roots.map(b=>b.id)};
 return {transaction:tr.setMeta('blockMove',true),ids:roots.map(b=>b.id)};
}
export function siblingStep(tree:BlockTree,ids:string[],direction:number):Destination|null{
 const roots=selectionRoots(tree,ids);if(!roots.length||!roots.every(b=>b.parentId===roots[0].parentId))return null;
 const siblings=tree.blocks.filter(b=>b.parentId===roots[0].parentId),indices=roots.map(b=>siblings.indexOf(b));
 const next=(direction<0?Math.min(...indices):Math.max(...indices))+direction;
 if(next<0||next>=siblings.length)return null;
 return {containerId:roots[0].parentId,anchorId:siblings[next].id,side:direction<0?'before':'after'};
}
