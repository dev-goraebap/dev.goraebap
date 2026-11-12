/** 공휴일 하루(호호코워크 CalendarHoliday). 연휴는 날마다 한 줄이고, 대체공휴일은 따로 이름을 붙인다. */
export type Holiday = {
  /** YYYY-MM-DD */
  date: string
  name: string
}
