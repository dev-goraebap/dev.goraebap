# Input (angular)

공통 규칙은 [index.md](index.md)에 있습니다.

## usage

```html
<input [class]="inputVariants()" placeholder="name@goraebap.xyz" />
<input [class]="inputVariants({ invalid: hasError() })" [attr.aria-invalid]="hasError()" />
```
