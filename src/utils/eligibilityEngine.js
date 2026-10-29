/**
 * Enhanced Rule-Based Eligibility Evaluation Engine
 * Evaluates citizen profile against verified scheme criteria
 * and classifies results as Eligible, Potentially Eligible, or Not Eligible.
 */

export const EDUCATION_RANK = {
  "None": 0,
  "Class 5th Passed": 1,
  "Class 8th Passed": 2,
  "Class 10th Passed": 3,
  "Class 12th Passed": 4,
  "Undergraduate Passed": 5,
  "Postgraduate Passed": 6
};

/**
 * Evaluates a single scheme against a citizen profile
 * @param {Object} profile - Citizen profile details
 * @param {Object} scheme - Scheme data
 * @returns {Object} Evaluation result with status, score, matched/unmet/pending criteria
 */
export function evaluateEligibility(profile, scheme) {
  const criteria = scheme.eligibility;
  const matchedCriteria = [];
  const unmetCriteria = [];
  const pendingCriteria = [];

  let earnedScore = 0;
  let maxPossibleScore = 0;

  // 1. Age Evaluation (Weight: 20)
  maxPossibleScore += 20;
  if (profile.age !== undefined && profile.age !== null && profile.age !== '') {
    const age = Number(profile.age);
    if (age >= criteria.minAge && age <= criteria.maxAge) {
      matchedCriteria.push({
        field: 'age',
        label: 'Age Requirement',
        detail: `Age (${age} yrs) satisfies required age range of ${criteria.minAge} to ${criteria.maxAge} yrs.`
      });
      earnedScore += 20;
    } else {
      unmetCriteria.push({
        field: 'age',
        label: 'Age Requirement',
        detail: `Age (${age} yrs) is outside the eligible range of ${criteria.minAge} - ${criteria.maxAge} yrs.`
      });
    }
  } else {
    pendingCriteria.push({
      field: 'age',
      label: 'Age Verification',
      detail: `Age not provided in profile. Verification required (${criteria.minAge} - ${criteria.maxAge} yrs).`
    });
  }

  // 2. Annual Income Evaluation (Weight: 25)
  maxPossibleScore += 25;
  if (profile.income !== undefined && profile.income !== null && profile.income !== '') {
    const income = Number(profile.income);
    if (income <= criteria.maxIncome) {
      matchedCriteria.push({
        field: 'income',
        label: 'Income Threshold',
        detail: `Annual family income (₹${income.toLocaleString('en-IN')}) is within the cap of ₹${criteria.maxIncome.toLocaleString('en-IN')}.`
      });
      earnedScore += 25;
    } else {
      unmetCriteria.push({
        field: 'income',
        label: 'Income Threshold',
        detail: `Annual family income (₹${income.toLocaleString('en-IN')}) exceeds maximum limit of ₹${criteria.maxIncome.toLocaleString('en-IN')}.`
      });
    }
  } else {
    pendingCriteria.push({
      field: 'income',
      label: 'Income Verification',
      detail: `Income not specified. Requires income certificate showing income <= ₹${criteria.maxIncome.toLocaleString('en-IN')}.`
    });
  }

  // 3. Gender Evaluation (Weight: 10)
  maxPossibleScore += 10;
  if (criteria.gender === "All") {
    matchedCriteria.push({
      field: 'gender',
      label: 'Gender Eligibility',
      detail: `Open to all genders (Your profile: ${profile.gender || 'Not specified'}).`
    });
    earnedScore += 10;
  } else if (profile.gender === criteria.gender) {
    matchedCriteria.push({
      field: 'gender',
      label: 'Gender Eligibility',
      detail: `Gender (${profile.gender}) matches scheme target requirement (${criteria.gender} only).`
    });
    earnedScore += 10;
  } else if (!profile.gender) {
    pendingCriteria.push({
      field: 'gender',
      label: 'Gender Verification',
      detail: `Gender not specified in profile. Scheme restricted to ${criteria.gender}.`
    });
  } else {
    unmetCriteria.push({
      field: 'gender',
      label: 'Gender Eligibility',
      detail: `Scheme is restricted to ${criteria.gender} applicants only (Your profile: ${profile.gender}).`
    });
  }

  // 4. Domicile / Residence State Evaluation (Weight: 15)
  maxPossibleScore += 15;
  if (scheme.state === "All India") {
    matchedCriteria.push({
      field: 'state',
      label: 'State Domicile',
      detail: `Nationwide Central scheme applicable to residents of all States & UTs (Your state: ${profile.state || 'All India'}).`
    });
    earnedScore += 15;
  } else if (profile.state === scheme.state) {
    matchedCriteria.push({
      field: 'state',
      label: 'State Domicile',
      detail: `Resident of ${profile.state}, matching this state-specific welfare scheme.`
    });
    earnedScore += 15;
  } else if (!profile.state) {
    pendingCriteria.push({
      field: 'state',
      label: 'Domicile Verification',
      detail: `State not specified. Scheme requires permanent residence in ${scheme.state}.`
    });
  } else {
    unmetCriteria.push({
      field: 'state',
      label: 'State Domicile',
      detail: `Scheme is strictly for residents of ${scheme.state} (Your profile state: ${profile.state}).`
    });
  }

  // 5. Occupation Evaluation (Weight: 10)
  maxPossibleScore += 10;
  if (criteria.occupation.includes("All") || (profile.occupation && criteria.occupation.includes(profile.occupation))) {
    matchedCriteria.push({
      field: 'occupation',
      label: 'Occupation Match',
      detail: `Occupation (${profile.occupation || 'Any'}) satisfies eligible target groups (${criteria.occupation.join(', ')}).`
    });
    earnedScore += 10;
  } else if (!profile.occupation) {
    pendingCriteria.push({
      field: 'occupation',
      label: 'Occupation Verification',
      detail: `Occupation not specified. Eligible occupations: ${criteria.occupation.join(', ')}.`
    });
  } else {
    unmetCriteria.push({
      field: 'occupation',
      label: 'Occupation Match',
      detail: `Occupation '${profile.occupation}' is not among eligible categories (${criteria.occupation.join(', ')}).`
    });
  }

  // 6. Social Category Evaluation (Weight: 10)
  maxPossibleScore += 10;
  // Special exception rule for Stand Up India: Women OR SC/ST
  const isStandUpSpecial = scheme.id === 'stand-up-india';
  if (isStandUpSpecial) {
    const isWoman = profile.gender === 'Female';
    const isScSt = ['SC', 'ST'].includes(profile.category);
    if (isWoman || isScSt) {
      matchedCriteria.push({
        field: 'category',
        label: 'Category / Gender Condition',
        detail: `Qualifies under Stand Up India criteria (${isWoman ? 'Woman Entrepreneur' : 'SC/ST Entrepreneur'}).`
      });
      earnedScore += 10;
    } else {
      unmetCriteria.push({
        field: 'category',
        label: 'Category / Gender Condition',
        detail: `Stand Up India requires applicant to be either a Woman OR belong to SC/ST category.`
      });
    }
  } else if (criteria.category.includes("All") || (profile.category && criteria.category.includes(profile.category))) {
    matchedCriteria.push({
      field: 'category',
      label: 'Social Category',
      detail: `Category (${profile.category || 'General'}) qualifies for scheme target quota (${criteria.category.join(', ')}).`
    });
    earnedScore += 10;
  } else if (!profile.category) {
    pendingCriteria.push({
      field: 'category',
      label: 'Category Verification',
      detail: `Social category not specified. Scheme reserved for: ${criteria.category.join(', ')}.`
    });
  } else {
    unmetCriteria.push({
      field: 'category',
      label: 'Social Category',
      detail: `Category '${profile.category}' does not qualify for this reserved category scheme (${criteria.category.join(', ')}).`
    });
  }

  // 7. Educational Qualification Evaluation (Weight: 5)
  maxPossibleScore += 5;
  const userEduRank = EDUCATION_RANK[profile.education] !== undefined ? EDUCATION_RANK[profile.education] : 0;
  const requiredEduRank = EDUCATION_RANK[criteria.minEducation] !== undefined ? EDUCATION_RANK[criteria.minEducation] : 0;

  if (userEduRank >= requiredEduRank) {
    matchedCriteria.push({
      field: 'education',
      label: 'Education Qualification',
      detail: `Education level (${profile.education || 'None'}) satisfies minimum benchmark of '${criteria.minEducation}'.`
    });
    earnedScore += 5;
  } else {
    unmetCriteria.push({
      field: 'education',
      label: 'Education Qualification',
      detail: `Requires at least '${criteria.minEducation}', but profile indicates '${profile.education || 'None'}'.`
    });
  }

  // 8. Disability Requirement (Weight: 5)
  maxPossibleScore += 5;
  if (!criteria.disabilityRequired) {
    matchedCriteria.push({
      field: 'disability',
      label: 'Disability Status',
      detail: `No benchmark disability required (Open to all citizens).`
    });
    earnedScore += 5;
  } else if (profile.isDisabled) {
    matchedCriteria.push({
      field: 'disability',
      label: 'Disability Status',
      detail: `Benchmark disability (UDID 40%+) verified for specialized disability welfare scheme.`
    });
    earnedScore += 5;
  } else {
    unmetCriteria.push({
      field: 'disability',
      label: 'Disability Status',
      detail: `Scheme strictly requires 40%+ benchmark disability (UDID card).`
    });
  }

  // 9. Marital Status Check
  if (criteria.maritalStatus !== "All") {
    if (profile.maritalStatus === criteria.maritalStatus) {
      matchedCriteria.push({
        field: 'maritalStatus',
        label: 'Marital Status',
        detail: `Marital status (${profile.maritalStatus}) matches requirement (${criteria.maritalStatus}).`
      });
    } else if (!profile.maritalStatus) {
      pendingCriteria.push({
        field: 'maritalStatus',
        label: 'Marital Status Verification',
        detail: `Marital status not specified. Scheme requires '${criteria.maritalStatus}'.`
      });
    } else {
      unmetCriteria.push({
        field: 'maritalStatus',
        label: 'Marital Status',
        detail: `Scheme is restricted to '${criteria.maritalStatus}' citizens (Your profile: ${profile.maritalStatus}).`
      });
    }
  }

  // 10. Specific Scheme Verification Conditions (Land, BPL, Document Proofs)
  if (criteria.requiresLand) {
    if (profile.ownsLand === true) {
      matchedCriteria.push({
        field: 'land',
        label: 'Land Records',
        detail: `Cultivable land possession indicated in profile.`
      });
    } else if (profile.ownsLand === false) {
      unmetCriteria.push({
        field: 'land',
        label: 'Land Records',
        detail: `Scheme requires ownership of cultivable land, but profile indicates no land ownership.`
      });
    } else {
      pendingCriteria.push({
        field: 'land',
        label: 'Land Records Verification',
        detail: `Must verify cultivable land ownership documents (Patta / Khatauni) before final approval.`
      });
    }
  }

  if (criteria.requiresBpl) {
    if (profile.hasBplCard === true) {
      matchedCriteria.push({
        field: 'bpl',
        label: 'BPL / SECC Status',
        detail: `BPL / Ration card status verified.`
      });
    } else if (profile.hasBplCard === false && profile.income > 200000) {
      unmetCriteria.push({
        field: 'bpl',
        label: 'BPL / SECC Status',
        detail: `Scheme targets Below Poverty Line households, which does not match your profile.`
      });
    } else {
      pendingCriteria.push({
        field: 'bpl',
        label: 'BPL / Ration Card Verification',
        detail: `Requires verification against SECC database or active BPL ration card.`
      });
    }
  }

  // Additional documentary verification items listed in scheme
  if (criteria.verificationConditions && criteria.verificationConditions.length > 0) {
    criteria.verificationConditions.forEach((cond) => {
      // If not already covered by specific profile flags, list as pending verification
      if (!criteria.requiresLand || !cond.toLowerCase().includes('land') || profile.ownsLand === undefined) {
        if (!criteria.requiresBpl || !cond.toLowerCase().includes('bpl') || profile.hasBplCard === undefined) {
          pendingCriteria.push({
            field: 'document',
            label: 'Documentary Verification Required',
            detail: cond
          });
        }
      }
    });
  }

  // Classification into 3 States:
  // 1. Not Eligible: At least one hard criteria failed
  // 2. Potentially Eligible: No hard criteria failed, but pending verifications exist or missing data
  // 3. Eligible: All criteria matched and no unmet or blocking pending conditions
  let status = 'Eligible';
  let isEligible = false;
  let isPotentiallyEligible = false;

  if (unmetCriteria.length > 0) {
    status = 'Not Eligible';
    isEligible = false;
    isPotentiallyEligible = false;
  } else if (pendingCriteria.length > 0) {
    status = 'Potentially Eligible';
    isEligible = false;
    isPotentiallyEligible = true;
  } else {
    status = 'Eligible';
    isEligible = true;
    isPotentiallyEligible = false;
  }

  // Calculate Match Percentage
  let rawPercent = Math.round((earnedScore / maxPossibleScore) * 100);
  let matchPercentage;

  if (status === 'Eligible') {
    matchPercentage = Math.min(100, Math.max(88, rawPercent));
  } else if (status === 'Potentially Eligible') {
    matchPercentage = Math.min(84, Math.max(60, rawPercent - (pendingCriteria.length * 3)));
  } else {
    matchPercentage = Math.min(48, Math.max(10, Math.round(rawPercent * 0.5)));
  }

  // Generate Clear Decision Explanation
  let decisionExplanation = '';
  if (status === 'Eligible') {
    decisionExplanation = `Eligible: Your profile matches all fundamental criteria including age, income, domicile, category, and occupation.`;
  } else if (status === 'Potentially Eligible') {
    decisionExplanation = `Potentially Eligible: You meet core demographic criteria, but ${pendingCriteria.length} item(s) require verification or supporting documentation.`;
  } else {
    const reasonsSummary = unmetCriteria.map(u => u.label).join(', ');
    decisionExplanation = `Not Eligible: Does not satisfy scheme requirements (${reasonsSummary}).`;
  }

  // Backward compatibility format for legacy components
  const reasons = matchedCriteria.map(m => `✓ ${m.detail}`);
  const rejections = unmetCriteria.map(u => `✕ ${u.detail}`);
  const pending = pendingCriteria.map(p => `⚠ ${p.detail}`);

  return {
    schemeId: scheme.id,
    scheme,
    status, // 'Eligible' | 'Potentially Eligible' | 'Not Eligible'
    isEligible,
    isPotentiallyEligible,
    matchPercentage,
    decisionExplanation,
    matchedCriteria,
    unmetCriteria,
    pendingCriteria,
    reasons,
    rejections,
    pending
  };
}

/**
 * Evaluates all schemes and sorts with smart prioritization:
 * 1. Eligible schemes first
 * 2. Potentially Eligible second
 * 3. Highest match percentage
 * @param {Object} profile - Citizen profile details
 * @param {Array} schemes - Array of scheme objects
 * @returns {Array} Sorted evaluation results
 */
export function evaluateAllSchemes(profile, schemes) {
  if (!schemes || !Array.isArray(schemes)) return [];

  return schemes.map(scheme => evaluateEligibility(profile, scheme))
    .sort((a, b) => {
      const rank = (item) => {
        if (item.status === 'Eligible') return 3;
        if (item.status === 'Potentially Eligible') return 2;
        return 1;
      };
      const rankDiff = rank(b) - rank(a);
      if (rankDiff !== 0) return rankDiff;
      return b.matchPercentage - a.matchPercentage;
    });
}
