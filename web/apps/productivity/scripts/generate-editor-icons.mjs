import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../package.json',import.meta.url));
const data=require('@iconify-json/solar/icons.json'),mapping=JSON.parse(readFileSync(new URL('./editor-icon-map.json',import.meta.url),'utf8'));
const result={};for(const [name,key]of Object.entries(mapping)){if(!data.icons[key])throw Error('Unknown Solar icon '+key);result[name]={name:key,body:data.icons[key].body};}
const lib='../src/shared/lib/rich-document/';
writeFileSync(new URL(lib+'solar-data.ts',import.meta.url),'// Generated from @iconify-json/solar. Solar by 480 Design, CC BY 4.0.\nexport const solarData='+JSON.stringify(result)+' as const;\n');
writeFileSync(new URL(lib+'icons.ts',import.meta.url),"import {solarIcon} from './SolarIcon';\n"+Object.keys(mapping).map(name=>`export const ${name}=solarIcon('${name}');`).join('\n')+'\n');
