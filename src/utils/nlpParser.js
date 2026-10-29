import { STATES_AND_DISTRICTS, OCCUPATIONS, CATEGORIES, EDUCATION_LEVELS } from '../data/statesAndDistricts.js';

export function parseNaturalLanguageInput(text, currentProfile = {}) {
  const extracted = { ...currentProfile };
  const lower = text.toLowerCase();

  // 1. Extract Name (e.g. "My name is John", "I am Priya", "Name is Kumar")
  const nameMatch = text.match(/(?:my name is|i am|name is|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  if (nameMatch && !["a", "an", "the", "working", "living", "from"].includes(nameMatch[1].toLowerCase())) {
    extracted.name = nameMatch[1];
  }

  // 2. Extract Age (e.g. "22 years old", "age 35", "I am 19", "25 y/o")
  const ageMatch = lower.match(/\b(?:i am\s+)?(\d{1,2})\s*(?:years|yr|yrs|year|y\/o|age)?\b/);
  if (ageMatch) {
    const ageNum = parseInt(ageMatch[1], 10);
    if (ageNum >= 1 && ageNum <= 100) {
      extracted.age = ageNum;
    }
  }

  // 3. Extract Gender
  if (/\b(female|woman|girl|lady|mother)\b/.test(lower)) {
    extracted.gender = "Female";
  } else if (/\b(male|man|boy|father)\b/.test(lower)) {
    extracted.gender = "Male";
  } else if (/\b(transgender|other|trans)\b/.test(lower)) {
    extracted.gender = "Transgender";
  }

  // 4. Extract Annual Family Income (e.g. "1.5 lakhs", "1,50,000", "200000", "2.5L", "250k")
  const incomeLakhMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|l|lac|lacs)\b/);
  const incomeKMatch = lower.match(/(\d+)\s*(?:k|thousand)\b/);
  const incomeExactMatch = lower.match(/(?:income|salary|earning|earns|family income|annual income)?\s*(?:rs\.?|₹)?\s*(\d{1,2}(?:,\d{3})+|\d{5,7})\b/);

  if (incomeLakhMatch) {
    extracted.income = parseFloat(incomeLakhMatch[1]) * 100000;
  } else if (incomeKMatch) {
    extracted.income = parseInt(incomeKMatch[1], 10) * 1000;
  } else if (incomeExactMatch) {
    extracted.income = parseInt(incomeExactMatch[1].replace(/,/g, ''), 10);
  }

  // 5. Extract State & District
  for (const stateName of Object.keys(STATES_AND_DISTRICTS)) {
    if (stateName !== "All India" && lower.includes(stateName.toLowerCase())) {
      extracted.state = stateName;
      // Check district
      const districts = STATES_AND_DISTRICTS[stateName];
      for (const dist of districts) {
        if (lower.includes(dist.toLowerCase())) {
          extracted.district = dist;
          break;
        }
      }
      break;
    }
  }

  // 6. Extract Occupation
  for (const occ of OCCUPATIONS) {
    if (lower.includes(occ.toLowerCase()) || 
       (occ === "Student" && /\b(studying|college|school|student)\b/.test(lower)) ||
       (occ === "Farmer" && /\b(farming|agriculture|farmer|kisan)\b/.test(lower)) ||
       (occ === "Housewife" && /\b(homemaker|housewife)\b/.test(lower)) ||
       (occ === "Street Vendor" && /\b(vendor|hawker|cart)\b/.test(lower)) ||
       (occ === "Artisan" && /\b(craftsman|weaver|potter|carpenter|tailor|artisan)\b/.test(lower))) {
      extracted.occupation = occ;
      break;
    }
  }

  // 7. Extract Category
  if (/\b(sc|scheduled caste)\b/.test(lower)) extracted.category = "SC";
  else if (/\b(st|scheduled tribe)\b/.test(lower)) extracted.category = "ST";
  else if (/\b(obc|other backward)\b/.test(lower)) extracted.category = "OBC";
  else if (/\b(ews|economically weaker)\b/.test(lower)) extracted.category = "EWS";
  else if (/\b(general|oc|unreserved)\b/.test(lower)) extracted.category = "General";

  // 8. Extract Education Level
  if (/\b(postgraduate|pg|master|mtech|msc|mba|ma)\b/.test(lower)) extracted.education = "Postgraduate Passed";
  else if (/\b(undergraduate|degree|bachelor|btech|bsc|bcom|ba|graduate)\b/.test(lower)) extracted.education = "Undergraduate Passed";
  else if (/\b(12th|hsc|plus two|inter|intermediate|higher secondary)\b/.test(lower)) extracted.education = "Class 12th Passed";
  else if (/\b(10th|sslc|matric|matriculation)\b/.test(lower)) extracted.education = "Class 10th Passed";
  else if (/\b(8th|eighth)\b/.test(lower)) extracted.education = "Class 8th Passed";
  else if (/\b(5th|fifth)\b/.test(lower)) extracted.education = "Class 5th Passed";

  // 9. Extract Disability Status
  if (/\b(disabled|disability|handicapped|pwd|differently abled|udid)\b/.test(lower)) {
    extracted.isDisabled = true;
  } else if (/\b(no disability|normal|not disabled|none)\b/.test(lower)) {
    extracted.isDisabled = false;
  }

  // 10. Extract Marital Status
  if (/\b(married|spouse|wife|husband)\b/.test(lower)) extracted.maritalStatus = "Married";
  else if (/\b(widow|widowed)\b/.test(lower)) extracted.maritalStatus = "Widowed";
  else if (/\b(single|unmarried|bachelor)\b/.test(lower)) extracted.maritalStatus = "Single";

  return extracted;
}
