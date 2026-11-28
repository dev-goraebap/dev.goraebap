# OTP Field (react)

공통 규칙은 [index.md](index.md)에 있습니다.

## usage

```tsx
import { OTPField, OTPFieldInput, OTPFieldSeparator } from "@goraebap/ui-react/components/otp-field";

export function Example() {
  return (
    <OTPField length={6}>
      <OTPFieldInput /><OTPFieldInput /><OTPFieldInput />
      <OTPFieldSeparator />
      <OTPFieldInput /><OTPFieldInput /><OTPFieldInput />
    </OTPField>
  );
}
```
