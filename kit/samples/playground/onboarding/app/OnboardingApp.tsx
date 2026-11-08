import {Button} from '@astryxdesign/core/Button';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Text} from '@astryxdesign/core/Text';
import {Switch} from '@astryxdesign/core/Switch';
import {Step,Stepper} from '@astryxdesign/core/Stepper';
import {VStack} from '@astryxdesign/core/VStack';
import {HStack} from '@astryxdesign/core/HStack';
import {Heading} from '@astryxdesign/core/Heading';
import {useState,useRef,useEffect,createContext,useContext} from 'react';
import {createRootRoute,createRoute,createRouter,createMemoryHistory,RouterProvider,useNavigate,useSearch} from '@tanstack/react-router';
import {WorkflowBrand} from '@kit/foundations/brand/WorkflowBrand';
import {drawnAvatarSource} from '@kit/foundations/avatar/drawn-avatars';
import {PersonAvatar} from '@kit/foundations/avatar/PersonAvatar';
import {useThemePreference} from '@kit/foundations/ReferenceTheme';
import {celebrate} from '@kit/foundations/motion/celebrate';
import styles from './wizard.module.css';
const labels=['테마','프로필','알림','완료'];
type Preferences={theme:'system'|'light'|'dark';name:string;avatar:number;mentions:boolean;digest:boolean};
const PreferencesContext=createContext<{value:Preferences;set:(next:Preferences)=>void}>(null!);
function Screen(){const {value,set}=useContext(PreferencesContext);return <Wizard value={value} onChange={set}/>}
export function OnboardingApp({initialPath='/setup'}:{initialPath?:string}){
 const [value,set]=useState<Preferences>({theme:'system',name:'서윤',avatar:0,mentions:true,digest:false});
 const [router]=useState(()=>{const root=createRootRoute();const render=Screen;const setup=createRoute({getParentRoute:()=>root,path:'/setup',component:render});const home=createRoute({getParentRoute:()=>root,path:'/',component:render});return createRouter({routeTree:root.addChildren([setup,home]),history:createMemoryHistory({initialEntries:[initialPath]})})});
 return <PreferencesContext value={{value,set}}><RouterProvider router={router}/></PreferencesContext>;
}
function Wizard({value,onChange}:{value:Preferences;onChange:(next:Preferences)=>void}){
 const search=useSearch({strict:false}) as {step?:number};const step=Math.max(0,Math.min(3,Number(search.step)||0));const navigate=useNavigate();const setTheme=useThemePreference();const heading=useRef<HTMLHeadingElement>(null);const [error,setError]=useState<string>();const [finished,setFinished]=useState(false);
 useEffect(()=>{heading.current?.focus()},[step]);
 const go=(next:number)=>void navigate({href:`/setup?step=${next}`});
 const next=()=>{if(step===1&&!value.name.trim()){setError('이름을 입력해 주세요.');return;}setError(undefined);go(step+1)};
 const finish=()=>{try{localStorage.setItem('workflow-onboarding',JSON.stringify(value))}catch{}setFinished(true);celebrate(heading.current)};
 const titles=['편한 화면으로 시작하세요','동료에게 보여 줄 내 모습','필요한 소식만 받아 보세요','준비가 끝났습니다'];
 return <main className={styles.screen}><div className={styles.shell}><WorkflowBrand/><Stepper activeStep={step} label="온보딩 단계" density="compact">{labels.map((label,i)=><Step key={label} step={i} label={label}/>)}</Stepper>
 <section className={styles.content}><Heading ref={heading} level={1} tabIndex={-1}>{finished?'환영합니다, '+value.name+'님':titles[step]}</Heading>
 {finished?<Text>설정을 저장했습니다. 이제 작업 공간을 사용할 수 있습니다.</Text>:step===0?<div className={styles.themes}>{(['light','dark','system'] as const).map((theme,i)=><button key={theme} type="button" className={styles.theme} data-mode={theme} aria-pressed={value.theme===theme} onClick={()=>{onChange({...value,theme});setTheme(theme)}}><span className={styles.mini}><i/><i/><i/></span><strong>{['라이트','다크','시스템 설정'][i]}</strong></button>)}</div>:step===1?<VStack gap={5}>
 <HStack gap={4} vAlign="center"><PersonAvatar name={value.name} src={drawnAvatarSource(value.avatar)} size="lg" shape="circle"/><TextInput label="이름" value={value.name} onChange={name=>onChange({...value,name})} statusVariant="detached" status={error?{type:'error',message:error}:undefined}/></HStack>
 <div className={styles.avatars} role="group" aria-label="프로필 그림">{Array.from({length:18},(_,i)=><button type="button" key={i} aria-label={`프로필 그림 ${i+1}`} aria-pressed={value.avatar===i} onClick={()=>onChange({...value,avatar:i})}><img alt="" src={drawnAvatarSource(i)}/></button>)}</div>
 </VStack>:step===2?<VStack className={styles.notifications} gap={5}><Switch label="멘션과 담당 알림" value={value.mentions} onChange={mentions=>onChange({...value,mentions})}/><Switch label="하루 요약" value={value.digest} onChange={digest=>onChange({...value,digest})}/><Text color="secondary">알림 설정은 나중에 내 계정에서 바꿀 수 있습니다.</Text></VStack>:<VStack gap={4} hAlign="center"><PersonAvatar name={value.name} src={drawnAvatarSource(value.avatar)} size="lg" shape="circle"/><Text>{value.name}님만의 작업 공간을 시작해 보세요.</Text></VStack>}
 </section>{!finished?<footer className={styles.footer}><Button label="이전" variant="ghost" isDisabled={step===0} onClick={()=>go(step-1)}/><HStack gap={2}>{step===2?<Button label="나중에 설정" variant="ghost" onClick={()=>go(3)}/>:null}<Button label={step===3?'시작하기':'다음'} variant="primary" onClick={step===3?finish:next}/></HStack></footer>:null}
 </div></main>;
}
