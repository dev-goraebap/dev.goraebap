/**
 * 첨부 파일의 종류(cowork): 확장자로 가르고, 종류마다 짧은 표시(PDF · DOC …)와 이름, 색 묶음(tone)을 준다. 파일 카드가
 * 이 색으로 종류를 한눈에 보이게 한다. 모르는 확장자는 확장자 그대로(없으면 FILE) 회색으로 보인다.
 */
export type FileKind={tone:'red'|'blue'|'green'|'orange'|'amber'|'sky'|'purple'|'gray';label:string;name:string};

const KINDS:[extensions:string[],kind:FileKind][]=[
 [['pdf'],{tone:'red',label:'PDF',name:'PDF 문서'}],
 [['doc','docx','rtf','odt'],{tone:'blue',label:'DOC',name:'워드 문서'}],
 [['hwp','hwpx'],{tone:'sky',label:'HWP',name:'한글 문서'}],
 [['xls','xlsx','xlsm','ods'],{tone:'green',label:'XLS',name:'엑셀 시트'}],
 [['csv','tsv'],{tone:'green',label:'CSV',name:'표 데이터'}],
 [['ppt','pptx','odp','key'],{tone:'orange',label:'PPT',name:'발표 자료'}],
 [['zip','7z','rar','tar','gz','tgz','bz2','xz'],{tone:'amber',label:'ZIP',name:'압축 파일'}],
 [['html','htm'],{tone:'orange',label:'HTML',name:'웹 문서'}],
 [['json','xml','yaml','yml','sql','js','ts','tsx','jsx','java','py','sh','css'],{tone:'purple',label:'CODE',name:'코드 · 데이터'}],
 [['txt','md','log'],{tone:'gray',label:'TXT',name:'텍스트'}],
 [['psd','ai','fig','sketch','xd'],{tone:'purple',label:'DSGN',name:'디자인 파일'}],
];

export function fileKind(name:string):FileKind{
 const extension=name.includes('.')?name.split('.').pop()!.toLowerCase():'';
 return KINDS.find(([extensions])=>extensions.includes(extension))?.[1]
  ??{tone:'gray',label:(extension||'file').slice(0,4).toUpperCase(),name:'첨부 파일'};
}
