import { useState } from "react"
import { useUpdateMe } from "@/entities/member"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/shared/ui/field"
import { Input } from "@/shared/ui/input"
import { toast } from "@/shared/ui/toast"
import { formatPhone, isPhone } from "../model/phone"
import { FormDialog } from "@/shared/ui/form-dialog"

/**
 * 휴대전화 수정(호호코워크 ContactDialog): 숫자만 받고 하이픈은 정해진 자리에 넣는다. 0으로 시작하는 9~11자리가
 * 아니면 저장할 때 알려 준다. 비워서 저장하면 번호를 지운다.
 */
export function PhoneDialog({ phone, open, onOpenChange }: { phone: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [value, setValue] = useState(phone)
  const [isTried, setTried] = useState(false)
  const update = useUpdateMe()
  const error = value && !isPhone(value) ? "0으로 시작하는 9~11자리 번호를 입력해 주세요. 예: 010-1234-5678" : undefined
  const save = () => {
    setTried(true)
    if (error) return
    update.mutate({ phone: value }, {
      onSuccess: () => {
        toast.add({ type: "success", title: value ? "휴대전화를 바꿨습니다" : "휴대전화를 지웠습니다" })
        onOpenChange(false)
      },
    })
  }
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="휴대전화 수정" onSubmit={save} isSubmitDisabled={value === phone}>
      <Field data-invalid={isTried && Boolean(error)}>
        <FieldLabel htmlFor="my-phone">휴대전화</FieldLabel>
        <Input id="my-phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={13} autoFocus placeholder="010-1234-5678"
          aria-invalid={isTried && Boolean(error)} value={value} onChange={event => setValue(formatPhone(event.target.value))} />
        {isTried && error ? <FieldError>{error}</FieldError> : <FieldDescription>비워서 저장하면 등록된 번호를 지웁니다.</FieldDescription>}
      </Field>
    </FormDialog>
  )
}
