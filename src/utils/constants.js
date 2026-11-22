// Frontend option lists for forms and filters. Values are kept in sync with
// the backend enums (medium: Bangla/English/English Version/Madrasa,
// tutorGender: any/male/female) so no translation is needed on submit.

export const SUBJECTS = [
  "Mathematics",
  "Higher Math",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Bangla",
  "ICT",
  "Computer Science",
  "History",
  "Geography",
  "Civics",
  "Economics",
  "Accounting",
  "Business Studies",
];

export const LOCATIONS = [
  "Dhaka",
  "Dhanmondi, Dhaka",
  "Mirpur, Dhaka",
  "Gazipur",
  "Narayanganj",
  "Chattogram",
  "Sylhet",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Rangpur",
  "Mymensingh",
  "Online",
];

export const CLASS_LEVELS = [
  "Class 1-5",
  "Class 6-10",
  "Class 9-10",
  "HSC",
  "SSC",
  "Undergraduate",
  "Graduate",
  "Admission Test",
];

export const DAYS = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

export const MEDIUMS = [
  { label: "Bangla Medium", value: "Bangla" },
  { label: "English Medium", value: "English" },
  { label: "English Version", value: "English Version" },
  { label: "Madrasa", value: "Madrasa" },
];

export const TUTOR_GENDERS = [
  { label: "No Preference", value: "any" },
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

export const STATUS_LABELS = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  accepted: "Accepted",
  withdrawn: "Withdrawn",
  completed: "Completed",
  active: "Active",
  suspended: "Suspended",
  inactive: "Inactive",
  open: "Open",
  resolved: "Resolved",
  unverified: "Unverified",
  verified: "Verified",
};

export function mediumLabel(value) {
  return MEDIUMS.find((m) => m.value === value)?.label || value || "";
}

export function genderLabel(value) {
  return TUTOR_GENDERS.find((g) => g.value === value)?.label || value || "";
}
