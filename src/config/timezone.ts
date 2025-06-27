// Group timezones by region for better organization and performance
export const groupedTimezones = {
  "North America": [
    "America/New_York", // Eastern Time
    "America/Chicago", // Central Time
    "America/Denver", // Mountain Time
    "America/Los_Angeles", // Pacific Time
    "America/Phoenix", // Arizona (no DST)
    "America/Anchorage", // Alaska
    "America/Toronto", // Eastern Canada
    "America/Vancouver", // Pacific Canada
    "America/Mexico_City", // Central Mexico
    "America/Halifax", // Atlantic Canada
    "America/St_Johns", // Newfoundland
    "America/Havana", // Cuba
    "America/Puerto_Rico", // Caribbean
    "America/Bogota", // Colombia
    "America/Lima", // Peru
    "America/Santiago", // Chile
    "America/Sao_Paulo", // Brazil
    "America/Argentina/Buenos_Aires", // Argentina
  ],
  Europe: [
    "Europe/London", // UK
    "Europe/Paris", // France
    "Europe/Berlin", // Germany
    "Europe/Rome", // Italy
    "Europe/Madrid", // Spain
    "Europe/Amsterdam", // Netherlands
    "Europe/Brussels", // Belgium
    "Europe/Zurich", // Switzerland
    "Europe/Lisbon", // Portugal
    "Europe/Dublin", // Ireland
    "Europe/Stockholm", // Sweden
    "Europe/Oslo", // Norway
    "Europe/Copenhagen", // Denmark
    "Europe/Helsinki", // Finland
    "Europe/Warsaw", // Poland
    "Europe/Vienna", // Austria
    "Europe/Budapest", // Hungary
    "Europe/Prague", // Czech Republic
    "Europe/Athens", // Greece
    "Europe/Moscow", // Russia
    "Europe/Istanbul", // Turkey
  ],
  Asia: [
    "Asia/Tokyo", // Japan
    "Asia/Shanghai", // China
    "Asia/Singapore", // Singapore
    "Asia/Dubai", // UAE
    "Asia/Hong_Kong", // Hong Kong
    "Asia/Seoul", // South Korea
    "Asia/Bangkok", // Thailand
    "Asia/Jakarta", // Indonesia
    "Asia/Manila", // Philippines
    "Asia/Kolkata", // India
    "Asia/Karachi", // Pakistan
    "Asia/Tehran", // Iran
    "Asia/Jerusalem", // Israel
    "Asia/Riyadh", // Saudi Arabia
    "Asia/Taipei", // Taiwan
    "Asia/Ho_Chi_Minh", // Vietnam
    "Asia/Kuala_Lumpur", // Malaysia
    "Asia/Dhaka", // Bangladesh
    "Asia/Beirut", // Lebanon
  ],
  Pacific: [
    "Pacific/Honolulu", // Hawaii
    "Pacific/Auckland", // New Zealand
    "Pacific/Fiji", // Fiji
    "Pacific/Guam", // Guam
    "Pacific/Tahiti", // Tahiti
    "Pacific/Port_Moresby", // Papua New Guinea
    "Pacific/Noumea", // New Caledonia
  ],
  Australia: [
    "Australia/Sydney", // New South Wales
    "Australia/Melbourne", // Victoria
    "Australia/Brisbane", // Queensland
    "Australia/Perth", // Western Australia
    "Australia/Adelaide", // South Australia
    "Australia/Darwin", // Northern Territory
    "Australia/Hobart", // Tasmania
  ],
  Africa: [
    "Africa/Cairo", // Egypt
    "Africa/Lagos", // Nigeria
    "Africa/Johannesburg", // South Africa
    "Africa/Nairobi", // Kenya
    "Africa/Casablanca", // Morocco
    "Africa/Tunis", // Tunisia
    "Africa/Accra", // Ghana
    "Africa/Algiers", // Algeria
    "Africa/Addis_Ababa", // Ethiopia
  ],
  Atlantic: [
    "Atlantic/Reykjavik", // Iceland
    "Atlantic/Azores", // Azores
    "Atlantic/Cape_Verde", // Cape Verde
    "Atlantic/Bermuda", // Bermuda
  ],
  Indian: [
    "Indian/Mauritius", // Mauritius
    "Indian/Maldives", // Maldives
    "Indian/Reunion", // Reunion
  ],
  Common: ["UTC", "GMT"],
};

// Helper function to format timezone for display
export const formatTimezone = (timezone: string) => {
  const now = new Date();
  try {
    const offset = new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    }).format(now);
    return `${timezone.replace(/_/g, " ")} (${offset})`;
  } catch (e) {
    console.error("Error formatting timezone:", e);
    return timezone.replace(/_/g, " ");
  }
};
