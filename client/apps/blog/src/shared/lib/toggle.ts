/** 여럿 고르는 값에서 하나를 넣거나 뺀다. */
export const toggleValue = <T,>(values: readonly T[] = [], value: T): T[] =>
  values.includes(value) ? values.filter(each => each !== value) : [...values, value]
