import type {SVGProps} from 'react';
import {solarData} from './solar-data';
type Props=SVGProps<SVGSVGElement>&{size?:number;strokeWidth?:number};
/** Solar 24-grid drawings retain their native 1.5 stroke; presentation props never alter the model. */
export function solarIcon(name:keyof typeof solarData){return function SolarDrawing({size=16,strokeWidth:_ignored,className='',...props}:Props){const icon=solarData[name],pixels=size>=22?24:size>=19?20:size>=17?18:16;return <svg {...props} className={`solar-icon ${className}`} width={pixels} height={pixels} viewBox="0 0 24 24" data-icon-set="solar" data-icon={icon.name} aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{__html:icon.body}}/>;};}
