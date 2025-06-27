export const formatPhoneNumber = (value: string | null | undefined) => {
  // Return empty string if value is null or undefined
  if (!value) return "";

  // Remove all non-numeric characters
  const phoneNumber = value.replace(/\D/g, "");

  // Format the number as (XXX) XXX-XXXX
  if (phoneNumber.length >= 10) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(
      3,
      6
    )}-${phoneNumber.slice(6, 10)}`;
  } else if (phoneNumber.length > 6) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(
      3,
      6
    )}-${phoneNumber.slice(6)}`;
  } else if (phoneNumber.length > 3) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  } else if (phoneNumber.length > 0) {
    return `(${phoneNumber}`;
  }
  return "";
};
