import { Button } from '@astryxdesign/core/Button';
import { Link } from '@astryxdesign/core/Link';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { useMutation } from '@tanstack/react-query';
import { useState,type FormEvent } from 'react';
import { useAuthApi } from '../../entities/auth';
import { AuthCard } from '../auth-card/AuthCard';
import { focusFirstInvalid } from '@/shared/ui/patterns/compose/validation';
import styles from '../../app/login.module.css';
export function SignUpPage({onCreated}:{onCreated:(email:string)=>void}){
 const api=useAuthApi();const [name,setName]=useState('');const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [tried,setTried]=useState(false);
 const errors={name:!name.trim()?'이름을 입력해 주세요.':undefined,email:!/^\S+@\S+\.\S+$/.test(email)?'이메일 주소를 확인해 주세요.':undefined,password:password.length<8?'비밀번호는 8자 이상 입력해 주세요.':undefined};
 const save=useMutation({mutationFn:()=>api.signUp(name.trim(),email.trim(),password),onSuccess:()=>onCreated(email)});
 const submit=(event:FormEvent)=>{event.preventDefault();setTried(true);if(Object.values(errors).some(Boolean)){focusFirstInvalid();return;}save.mutate()};
 return <AuthCard title="회원가입"><form noValidate onSubmit={submit} className={styles.form}><VStack gap={4}>
 <TextInput label="이름" value={name} onChange={setName} statusVariant="detached" status={tried&&errors.name?{type:'error',message:errors.name}:undefined}/>
 <TextInput label="이메일" type="email" value={email} onChange={setEmail} statusVariant="detached" status={tried&&errors.email?{type:'error',message:errors.email}:undefined}/>
 <TextInput label="비밀번호" type="password" value={password} onChange={setPassword} statusVariant="detached" status={tried&&errors.password?{type:'error',message:errors.password}:undefined}/>
 {save.isError?<Text role="alert" className={styles.error}>{save.error.message}</Text>:null}
 <Button type="submit" label="계정 만들기" width="100%" variant="primary" isLoading={save.isPending}/><Link href="/login">로그인으로</Link>
 </VStack></form></AuthCard>;
}
export function OtpPage({initialEmail='',hasCode=false,onSignedIn}:{initialEmail?:string;hasCode?:boolean;onSignedIn:(name:string)=>void}){
 const api=useAuthApi();const [email,setEmail]=useState(initialEmail);const [code,setCode]=useState('');const [sent,setSent]=useState(hasCode);const [tried,setTried]=useState(false);
 const request=useMutation({mutationFn:()=>api.requestCode(email),onSuccess:()=>{setSent(true);setTried(false)}});
 const verify=useMutation({mutationFn:()=>api.verifyCode(email,code),onSuccess:account=>onSignedIn(account.name)});
 const invalid=sent?!/^\d{6}$/.test(code):!/^\S+@\S+\.\S+$/.test(email);
 const submit=(event:FormEvent)=>{event.preventDefault();setTried(true);if(invalid){focusFirstInvalid();return;}if(sent)verify.mutate();else request.mutate()};
 return <AuthCard title={sent?'인증 코드 입력':'이메일로 로그인'}><form noValidate className={styles.form} onSubmit={submit}><VStack gap={4}>
 {sent?<><Text color="secondary">{email}로 보낸 6자리 코드를 입력해 주세요.</Text><TextInput label="인증 코드" value={code} onChange={setCode} ref={node=>{node?.setAttribute("inputmode","numeric");node?.setAttribute("autocomplete","one-time-code");node?.setAttribute("maxlength","6")}} hasAutoFocus statusVariant="detached" status={tried&&invalid?{type:'error',message:'6자리 코드를 입력해 주세요.'}:undefined}/></>:<TextInput label="이메일" value={email} onChange={setEmail} type="email" hasAutoFocus statusVariant="detached" status={tried&&invalid?{type:'error',message:'이메일 주소를 확인해 주세요.'}:undefined}/>}
 {verify.isError||request.isError?<Text role="alert" className={styles.error}>{verify.error?.message??request.error?.message}</Text>:null}
 <Button label={sent?'인증하고 로그인':'인증 코드 보내기'} type="submit" variant="primary" width="100%" isLoading={verify.isPending||request.isPending}/>
 {sent?<Button label="코드 다시 보내기" variant="ghost" isLoading={request.isPending} onClick={()=>request.mutate()}/>:null}<Link href="/login">로그인으로</Link>
 </VStack></form></AuthCard>;
}
