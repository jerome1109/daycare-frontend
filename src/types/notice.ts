export interface Notice {
  id: number;
  title: string;
  message: string;
  type: "info" | "warning" | "urgent";
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdBy: number;
  daycareId: number;
  creator?: {
    firstName: string;
    lastName: string;
  };
}

export interface NoticeFormData {
  title: string;
  message: string;
  type: "info" | "warning" | "urgent";
  startDate: string;
  endDate: string;
}
