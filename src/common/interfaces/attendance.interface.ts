export interface IAttendanceCount {
  present: number;
  absent: number;
  halfDay: number;
  late: number;
  holiday: number;
  leave: number;
}
export interface IAttendanceCalculation {
  workdays: number;
  days_in_month: number;
  weekly_offs: number;
  holidays: number;
  days_worked: number;
  unpaid_leaves: number;
  paid_leaves: number;
  month_words: string;
  month_number: number;
  year: number;
  attendance: IAttendanceCount;
}

export interface IAttendanceSummary {
  attendance: {
    present: number;
    absent: number;
    halfDay: number;
    late: number;
    holiday: number;
    leave: number;
  };
  paidLeaves: number;
  unpaidLeaves: number;
}
