# Accordion (react)

공통 규칙은 [index.md](index.md)에 있습니다.

## usage

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@goraebap/ui-react/components/accordion";

export function Example() {
  return (
    <Accordion defaultValue={["tokens"]}>
      <AccordionItem value="tokens">
        <AccordionTrigger>토큰은 어떻게 적용하나요?</AccordionTrigger>
        <AccordionContent>base.css와 테마 CSS를 불러옵니다.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```
