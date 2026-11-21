/** Shared import policy; conversion is still applied through each engine's parser/history. */
export function tsvTableHTML(text:string):string|null {
  const rows=text.replace(/\r\n?/g,'\n').replace(/\n$/,'').split('\n').map(row=>row.split('\t'));
  if(rows.length<2||rows.length>100||rows[0].length<2||rows[0].length>30||rows.some(row=>row.length!==rows[0].length))return null;
  const escape=(value:string)=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  return `<table><tbody>${rows.map(row=>`<tr>${row.map(cell=>`<td><p>${escape(cell)}</p></td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
