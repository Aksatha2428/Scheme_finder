export const SCHEMES_DATA = [
  {
    id: "pm-kisan",
    name: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
    category: "Agriculture",
    authority: "Central Government",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    state: "All India",
    objective: "Financial assistance of ₹6,000 per year in 3 equal installments to small and marginal farmer families across India.",
    benefits: "Direct bank transfer of ₹6,000 annually (₹2,000 every 4 months) directly into Aadhaar-linked bank accounts.",
    benefitType: "Direct Benefit Transfer",
    eligibility: {
      minAge: 18,
      maxAge: 75,
      maxIncome: 250000,
      gender: "All",
      occupation: ["Farmer", "Agriculture Worker", "Self-Employed"],
      category: ["All", "General", "OBC", "SC", "ST", "EWS"],
      minEducation: "None",
      disabilityRequired: false,
      maritalStatus: "All",
      requiresLand: true,
      requiresBpl: false,
      verificationConditions: [
        "Applicant must possess valid cultivable landholding records in their name",
        "Must complete e-KYC and Aadhaar seeding with bank account"
      ],
      otherConditions: "Institutional landholders, current/former constitutional post holders, and income-tax payers are excluded."
    },
    requiredDocuments: [
      "Aadhaar Card",
      "Land Ownership Record (Khata / Khasra / Patta)",
      "Aadhaar-seeded Bank Passbook",
      "Active Mobile Number for OTP verification"
    ],
    officialUrl: "https://pmkisan.gov.in",
    sourceReference: "PM-KISAN Operational Guidelines, Ministry of Agriculture & Farmers Welfare (pmkisan.gov.in)",
    lastVerified: "October 2026",
    deadline: "Open All Year (Continuous Registration)",
    faqs: [
      { q: "Is land ownership mandatory?", a: "Yes, applicant must own cultivable land registered in revenue records." },
      { q: "Can institutional landholders apply?", a: "No, institutional landholders and income tax payers are excluded." }
    ],
    applicationProcedure: [
      "Visit official portal https://pmkisan.gov.in or nearest Common Service Centre (CSC).",
      "Click on 'New Farmer Registration' and enter Aadhaar number & Mobile number.",
      "Select State, District, Sub-District, Block, and Village.",
      "Enter land record details (Survey/Khata number, DAG number, Area in hectares).",
      "Submit and note the Registration Reference ID for status tracking."
    ]
  },
  {
    id: "ayushman-bharat",
    name: "Ayushman Bharat - PM-JAY (Pradhan Mantri Jan Arogya Yojana)",
    category: "Health & Medical",
    authority: "Central Government",
    ministry: "National Health Authority (NHA), Ministry of Health & Family Welfare",
    state: "All India",
    objective: "Health protection cover of up to ₹5,00,000 per family per year for secondary and tertiary care hospitalization to vulnerable families.",
    benefits: "Cashless and paperless treatment up to ₹5 Lakhs per family per year across 28,000+ empanelled public and private hospitals nationwide.",
    benefitType: "Health Insurance",
    eligibility: {
      minAge: 0,
      maxAge: 100,
      maxIncome: 300000,
      gender: "All",
      occupation: ["All", "Laborer", "Farmer", "Unemployed", "Street Vendor", "Domestic Worker", "Artisan"],
      category: ["All", "General", "OBC", "SC", "ST", "EWS"],
      minEducation: "None",
      disabilityRequired: false,
      maritalStatus: "All",
      requiresLand: false,
      requiresBpl: true,
      verificationConditions: [
        "Family must be listed in Socio-Economic Caste Census (SECC 2011) database or possess valid Antyodaya / BPL Ration Card",
        "Biometric e-KYC verification at an empanelled hospital or CSC"
      ],
      otherConditions: "No restriction on family size, age, or pre-existing illnesses."
    },
    requiredDocuments: [
      "Aadhaar Card of all family members",
      "Ration Card (NFSA / BPL / SECC proof)",
      "Mobile Number",
      "Valid Photo Identity"
    ],
    officialUrl: "https://pmjay.gov.in",
    sourceReference: "National Health Authority Portal (pmjay.gov.in / beneficiary.nha.gov.in)",
    lastVerified: "October 2026",
    deadline: "Ongoing Scheme (Open Year-Round)",
    faqs: [
      { q: "Are pre-existing diseases covered?", a: "Yes, all pre-existing medical conditions are covered from day one." },
      { q: "Is there any premium to be paid?", a: "No, PM-JAY is 100% government funded; no premium is paid by the beneficiary." }
    ],
    applicationProcedure: [
      "Check eligibility at beneficiary.nha.gov.in or visit the nearest CSC / Empanelled Hospital.",
      "Meet the 'Ayushman Mitra' at the hospital helpdesk with your Aadhaar and Ration Card.",
      "Complete instant biometric authentication.",
      "Receive your electronic Ayushman Card (PM-JAY Golden Card) on the spot."
    ]
  },
  {
    id: "sukanya-samriddhi",
    name: "Sukanya Samriddhi Yojana (SSY)",
    category: "Women & Child",
    authority: "Central Government",
    ministry: "Ministry of Finance & Ministry of Women and Child Development",
    state: "All India",
    objective: "Government-backed savings scheme for parents of girl children to build a dedicated financial fund for higher education and marriage.",
    benefits: "High sovereign-guaranteed interest rate (8.2% p.a.), triple tax exemption under Section 80C (EEE status), matures 21 years from account opening.",
    benefitType: "Savings / Grant",
    eligibility: {
      minAge: 0,
      maxAge: 10,
      maxIncome: 2500000,
      gender: "Female",
      occupation: ["Student", "All"],
      category: ["All", "General", "OBC", "SC", "ST", "EWS"],
      minEducation: "None",
      disabilityRequired: false,
      maritalStatus: "Single",
      requiresLand: false,
      requiresBpl: false,
      verificationConditions: [
        "Account must be opened by biological parents or legal guardians on behalf of girl child below age 10",
        "Maximum 2 accounts per family (exception for twins/triplets)"
      ],
      otherConditions: "Child must be an Indian citizen resident in India."
    },
    requiredDocuments: [
      "Birth Certificate of the Girl Child",
      "Aadhaar Card of Parent / Legal Guardian",
      "Proof of Address (Utility Bill, Voter ID, Aadhaar)",
      "Passport-sized Photographs of Parent and Child"
    ],
    officialUrl: "https://www.indiapost.gov.in",
    sourceReference: "Department of Posts & Reserve Bank of India SSY Gazette Rules (indiapost.gov.in)",
    lastVerified: "October 2026",
    deadline: "Until girl child attains 10 years of age",
    faqs: [
      { q: "What is the minimum annual deposit?", a: "Minimum ₹250 per financial year; maximum up to ₹1,50,000." },
      { q: "When can funds be withdrawn for higher education?", a: "50% withdrawal allowed after the girl turns 18 or passes Class 10." }
    ],
    applicationProcedure: [
      "Visit any nearby Post Office branch or authorized public/commercial bank.",
      "Obtain and fill the SSY Account Opening Form (Form-1).",
      "Attach girl child birth certificate and parent's KYC documents.",
      "Submit with initial deposit (minimum ₹250) and collect official passbook."
    ]
  },
  {
    id: "post-matric-scholarship",
    name: "Post-Matric Scholarship Scheme for SC / ST / OBC Students",
    category: "Education & Scholarship",
    authority: "Central Government",
    ministry: "Ministry of Social Justice & Empowerment",
    state: "All India",
    objective: "Financial assistance to SC, ST, and OBC students pursuing post-secondary / higher education in recognized colleges and universities.",
    benefits: "100% reimbursement of non-refundable compulsory academic tuition fees plus monthly maintenance allowance up to ₹1,200 per month.",
    benefitType: "Scholarship",
    eligibility: {
      minAge: 15,
      maxAge: 35,
      maxIncome: 250000,
      gender: "All",
      occupation: ["Student"],
      category: ["SC", "ST", "OBC"],
      minEducation: "Class 10th Passed",
      disabilityRequired: false,
      maritalStatus: "All",
      requiresLand: false,
      requiresBpl: false,
      verificationConditions: [
        "Must be currently enrolled in an accredited post-matriculation institution",
        "Must hold valid Community Certificate issued by competent revenue authority (Tehsildar/SDM)"
      ],
      otherConditions: "Cannot hold any other centrally funded scholarship concurrently."
    },
    requiredDocuments: [
      "Community / Caste Certificate (SC/ST/OBC)",
      "Income Certificate issued by authorized Revenue Officer",
      "Class 10th & 12th Marksheets",
      "Current College Admission Fee Receipt / Bonafide Certificate",
      "Aadhaar-seeded Bank Account Passbook"
    ],
    officialUrl: "https://scholarships.gov.in",
    sourceReference: "National Scholarship Portal Guidelines, Ministry of Social Justice & Empowerment (scholarships.gov.in)",
    lastVerified: "October 2026",
    deadline: "31st October 2026 (Annual Academic Cycle)",
    faqs: [
      { q: "Can students enrolled in correspondence courses apply?", a: "Yes, recognized distance education programs approved by UGC/AICTE are eligible." },
      { q: "What is the maximum family income limit?", a: "Annual family income must not exceed ₹2.5 Lakhs from all sources." }
    ],
    applicationProcedure: [
      "Register on the National Scholarship Portal (NSP at scholarships.gov.in).",
      "Generate One-Time Registration (OTR) using Aadhaar-face/OTP e-KYC.",
      "Log in and fill application details under 'Post-Matric Scholarship Scheme'.",
      "Upload institutional verification bonafide, income, and caste certificates.",
      "Submit and notify institute nodal officer for institutional level verification."
    ]
  },
  {
    id: "pm-svanidhi",
    name: "PM SVANidhi - Micro Credit Scheme for Urban Street Vendors",
    category: "Business & Entrepreneurship",
    authority: "Central Government",
    ministry: "Ministry of Housing and Urban Affairs (MoHUA)",
    state: "All India",
    objective: "Affordable working capital credit to urban street vendors to resume livelihoods, formalize businesses, and transition to digital payments.",
    benefits: "Collateral-free micro loans starting at ₹10,000 (1st tranche), ₹20,000 (2nd tranche), up to ₹50,000 (3rd tranche) with 7% interest subsidy and up to ₹1,200 annual digital cashback.",
    benefitType: "Loan / Subsidy",
    eligibility: {
      minAge: 18,
      maxAge: 65,
      maxIncome: 350000,
      gender: "All",
      occupation: ["Street Vendor", "Small Business Owner", "Laborer", "Self-Employed"],
      category: ["All", "General", "OBC", "SC", "ST", "EWS"],
      minEducation: "None",
      disabilityRequired: false,
      maritalStatus: "All",
      requiresLand: false,
      requiresBpl: false,
      verificationConditions: [
        "Vendor must possess a Certificate of Vending / ID card issued by Urban Local Body (ULB) or Letter of Recommendation (LoR)",
        "Must be engaged in street vending in peri-urban or urban areas"
      ],
      otherConditions: "Clean repayment history unlocks subsequent larger loan tranches."
    },
    requiredDocuments: [
      "Aadhaar Card / Voter ID",
      "Certificate of Vending (CoV) or ULB Identity Card / LoR",
      "Bank Account details",
      "Mobile number linked with Aadhaar"
    ],
    officialUrl: "https://pmsvanidhi.mohua.gov.in",
    sourceReference: "Ministry of Housing and Urban Affairs SVANidhi Portal (pmsvanidhi.mohua.gov.in)",
    lastVerified: "October 2026",
    deadline: "31st December 2026",
    faqs: [
      { q: "Is collateral or guarantor required?", a: "No collateral or third-party guarantee is required." },
      { q: "How is the 7% interest subsidy paid?", a: "The subsidy is credited quarterly directly into your bank account via DBT." }
    ],
    applicationProcedure: [
      "Visit https://pmsvanidhi.mohua.gov.in or approach a Banking Correspondent (BC).",
      "Verify mobile number with OTP and enter Vendor Survey Reference.",
      "Select preferred Lending Institution / Bank Branch.",
      "Upload identity card/vending certificate and submit digital loan application.",
      "Sanctioned funds are disbursed directly within 7 working days."
    ]
  },
  {
    id: "pm-vishwakarma",
    name: "PM Vishwakarma Scheme for Traditional Artisans & Craftspeople",
    category: "Skill & Employment",
    authority: "Central Government",
    ministry: "Ministry of Micro, Small and Medium Enterprises (MSME)",
    state: "All India",
    objective: "End-to-end holistic support to traditional artisans and craftspeople across 18 designated family-based crafts (Carpenters, Blacksmiths, Potters, Masons, Tailors, etc.).",
    benefits: "PM Vishwakarma Digital Certificate & ID Card, 5-7 days basic skill training with ₹500/day stipend, ₹15,000 modern toolkit grant e-voucher, and collateral-free enterprise loan up to ₹3,00,000 at concessional 5% interest rate.",
    benefitType: "Skill & Financial Grant",
    eligibility: {
      minAge: 18,
      maxAge: 65,
      maxIncome: 300000,
      gender: "All",
      occupation: ["Artisan", "Laborer", "Self-Employed", "Small Business Owner"],
      category: ["All", "General", "OBC", "SC", "ST", "EWS"],
      minEducation: "None",
      disabilityRequired: false,
      maritalStatus: "All",
      requiresLand: false,
      requiresBpl: false,
      verificationConditions: [
        "Applicant must be actively practicing one of the 18 traditional family-based trades",
        "Must not have availed credit under PMEGP or Mudra for similar trade in the past 5 years"
      ],
      otherConditions: "Benefit is restricted to one member per family."
    },
    requiredDocuments: [
      "Aadhaar Card",
      "Active Mobile number for OTP verification",
      "Bank Account details (Account No & IFSC)",
      "Ration Card / Family details"
    ],
    officialUrl: "https://pmvishwakarma.gov.in",
    sourceReference: "Ministry of MSME Official Scheme Notification (pmvishwakarma.gov.in)",
    lastVerified: "October 2026",
    deadline: "Ongoing Scheme (Open Registration)",
    faqs: [
      { q: "Which trades are covered?", a: "18 traditional trades including Carpenter, Blacksmith, Potter, Sculptor, Cobbler, Mason, Basket/Mat Maker, Doll & Toy Maker, Barber, Garland Maker, Washerman, Tailor, Fishing Net Maker, etc." },
      { q: "Is collateral needed for the ₹3 Lakh loan?", a: "No, loans are 100% credit-guaranteed by Government of India." }
    ],
    applicationProcedure: [
      "Visit any Common Services Centre (CSC) with Aadhaar and active mobile.",
      "Complete biometric e-KYC and trade selection.",
      "Application is verified sequentially by Gram Panchayat / ULB, District Committee, and National Committee.",
      "Download PM Vishwakarma Digital ID and redeem toolkit e-voucher."
    ]
  },
  {
    id: "pm-awas-yojana-gramin",
    name: "Pradhan Mantri Awas Yojana - Gramin (PMAY-G)",
    category: "Housing",
    authority: "Central Government",
    ministry: "Ministry of Rural Development",
    state: "All India",
    objective: "Financial assistance for construction of a permanent pucca house with basic amenities to homeless and families living in kutcha/dilapidated houses in rural areas.",
    benefits: "Direct financial grant of ₹1,20,000 in plain areas or ₹1,30,000 in hilly/NE states + ₹12,000 for toilet construction under Swachh Bharat + 90-95 days of unskilled MGNREGA labor wages.",
    benefitType: "Housing Grant",
    eligibility: {
      minAge: 18,
      maxAge: 75,
      maxIncome: 200000,
      gender: "All",
      occupation: ["Unemployed", "Laborer", "Farmer", "Street Vendor", "Artisan"],
      category: ["All", "General", "OBC", "SC", "ST", "EWS"],
      minEducation: "None",
      disabilityRequired: false,
      maritalStatus: "All",
      requiresLand: true,
      requiresBpl: true,
      verificationConditions: [
        "Family must not own a pucca house anywhere in India",
        "Must be listed in SECC 2011 housing deprivation priority list or Gram Sabha verified waitlist",
        "Must possess land/plot for home construction"
      ],
      otherConditions: "Geo-tagging verification of old kutcha house and under-construction stages mandatory."
    },
    requiredDocuments: [
      "Aadhaar Card of all adult family members",
      "Bank Account details linked with Aadhaar",
      "MGNREGA Job Card Number",
      "Consent letter / Land possession certificate"
    ],
    officialUrl: "https://pmayg.nic.in",
    sourceReference: "Ministry of Rural Development Guidelines (pmayg.nic.in / awaassoft.nic.in)",
    lastVerified: "October 2026",
    deadline: "Ongoing Scheme",
    faqs: [
      { q: "How are installments disbursed?", a: "In 3 or 4 milestones linked directly to physical construction progress verified via geo-tagged photos." }
    ],
    applicationProcedure: [
      "Check inclusion in PMAY-G Permanent Wait List with your Gram Panchayat Secretary.",
      "Rural Housing Officer captures geo-tagged photographs of existing dwelling.",
      "Sanction letter issued and first installment released to bank account via DBT.",
      "Upload stage photos via AwaasApp to trigger second and third installments."
    ]
  },
  {
    id: "stand-up-india",
    name: "Stand-Up India Scheme for SC, ST & Women Entrepreneurs",
    category: "Business & Entrepreneurship",
    authority: "Central Government",
    ministry: "Department of Financial Services, Ministry of Finance",
    state: "All India",
    objective: "Facilitate bank loans between ₹10 Lakhs and ₹1 Crore to at least one SC or ST borrower and at least one woman borrower per bank branch for setting up greenfield enterprises.",
    benefits: "Composite bank loan (term loan + working capital) covering 85% of project cost between ₹10 Lakhs and ₹100 Lakhs for manufacturing, services, agri-allied, or trading ventures.",
    benefitType: "Loan / Subsidy",
    eligibility: {
      minAge: 18,
      maxAge: 65,
      maxIncome: 2500000,
      gender: "All",
      occupation: ["Entrepreneur", "Self-Employed", "Small Business Owner"],
      category: ["SC", "ST", "General", "OBC", "EWS"],
      minEducation: "Class 10th Passed",
      disabilityRequired: false,
      maritalStatus: "All",
      requiresLand: false,
      requiresBpl: false,
      verificationConditions: [
        "Borrower must be either a Woman OR belong to SC/ST category",
        "In non-individual enterprises, 51% of shareholding and controlling stake must be held by SC/ST or Woman entrepreneur",
        "Must be a greenfield project (first-time venture)"
      ],
      otherConditions: "Applicant must not be in default to any commercial bank or financial institution."
    },
    requiredDocuments: [
      "Aadhaar Card & PAN Card",
      "Caste Certificate (if applying under SC/ST quota)",
      "Detailed Project Report (DPR) with financial feasibility",
      "Business Registration / Partnership Deed / Incorporation Certificate",
      "Bank Account Statement (last 6 months)"
    ],
    officialUrl: "https://www.standupmitra.in",
    sourceReference: "Stand-Up Mitra Portal, Department of Financial Services (standupmitra.in)",
    lastVerified: "October 2026",
    deadline: "Continuous Open Window",
    faqs: [
      { q: "Can men apply?", a: "Men belonging to SC or ST categories are eligible. For General/OBC men, eligibility requires 51%+ controlling ownership by a Woman or SC/ST partner." }
    ],
    applicationProcedure: [
      "Register on www.standupmitra.in portal as 'Trainee' or 'Ready' borrower.",
      "Select Lead District Manager (LDM) or preferred commercial bank branch.",
      "Fill online application form and upload Project Report.",
      "Attend bank appraisal meeting for project sanction and loan documentation."
    ]
  },
  {
    id: "pm-mudra-yojana",
    name: "Pradhan Mantri MUDRA Yojana (PMMY)",
    category: "Business & Entrepreneurship",
    authority: "Central Government",
    ministry: "Department of Financial Services, Ministry of Finance",
    state: "All India",
    objective: "Provide collateral-free institutional credit to non-corporate, non-farm small and micro enterprises.",
    benefits: "Collateral-free loans up to ₹10 Lakhs across 3 categories: Shishu (up to ₹50,000), Kishore (₹50,001 to ₹5 Lakhs), and Tarun (₹5 Lakhs to ₹10 Lakhs) at competitive interest rates with Mudra RuPay card.",
    benefitType: "Loan / Subsidy",
    eligibility: {
      minAge: 18,
      maxAge: 65,
      maxIncome: 1200000,
      gender: "All",
      occupation: ["Small Business Owner", "Self-Employed", "Artisan", "Laborer", "Street Vendor", "Farmer"],
      category: ["All", "General", "OBC", "SC", "ST", "EWS"],
      minEducation: "None",
      disabilityRequired: false,
      maritalStatus: "All",
      requiresLand: false,
      requiresBpl: false,
      verificationConditions: [
        "Business must belong to manufacturing, trading, service, or agriculture-allied activities (dairy, poultry, fisheries)",
        "No prior loan default with any bank or financial institution"
      ],
      otherConditions: "No third party collateral or security required."
    },
    requiredDocuments: [
      "Aadhaar Card and PAN Card",
      "Proof of Business Address and Enterprise Identity (Udyam / GST / Trade License)",
      "Past 6 months bank statement",
      "Project quotation for equipment / machinery / working capital"
    ],
    officialUrl: "https://www.mudra.org.in",
    sourceReference: "MUDRA Official Operational Framework (mudra.org.in / udyamimitra.in)",
    lastVerified: "October 2026",
    deadline: "Open All Year",
    faqs: [
      { q: "Is collateral security needed?", a: "No, loans under MUDRA are collateral-free and backed by CGFMU guarantee." }
    ],
    applicationProcedure: [
      "Prepare business proposal and quotation of machinery/goods.",
      "Apply through https://udyamimitra.in or directly approach any public/private bank branch.",
      "Submit MUDRA application form with KYC and business proof.",
      "Bank conducts assessment and credits loan to borrower's account."
    ]
  },
  {
    id: "divyangjan-swavalamban",
    name: "Divyangjan Swavalamban Yojana (Concessional Loans for PwD)",
    category: "Disability Welfare",
    authority: "Central Government",
    ministry: "Department of Empowerment of Persons with Disabilities, MSJE",
    state: "All India",
    objective: "Provide financial assistance and concessional credit to Persons with Disabilities (PwD) for self-employment, higher education, and vocational ventures.",
    benefits: "Concessional loans up to ₹50 Lakhs at subsidized interest rates (5% to 8% p.a.) with 0.5% special rebate for women with disabilities.",
    benefitType: "Loan / Subsidy",
    eligibility: {
      minAge: 18,
      maxAge: 60,
      maxIncome: 500000,
      gender: "All",
      occupation: ["All", "Self-Employed", "Unemployed", "Artisan", "Small Business Owner"],
      category: ["All", "General", "OBC", "SC", "ST", "EWS"],
      minEducation: "None",
      disabilityRequired: true,
      maritalStatus: "All",
      requiresLand: false,
      requiresBpl: false,
      verificationConditions: [
        "Applicant must possess a valid Unique Disability ID (UDID) card or Disability Certificate with 40% or more benchmark disability",
        "Must be an Indian citizen"
      ],
      otherConditions: "Supported by National Handicapped Finance and Development Corporation (NHFDC)."
    },
    requiredDocuments: [
      "UDID Card / Disability Certificate (40%+ disability)",
      "Aadhaar Card & PAN Card",
      "Proof of Age and Residence",
      "Project Cost Estimate / Quotation"
    ],
    officialUrl: "https://nhfdc.nic.in",
    sourceReference: "National Handicapped Finance and Development Corporation Guidelines (nhfdc.nic.in)",
    lastVerified: "October 2026",
    deadline: "Open All Year",
    faqs: [
      { q: "Is UDID card compulsory?", a: "Yes, UDID card or competent authority disability certificate showing min 40% benchmark disability is mandatory." }
    ],
    applicationProcedure: [
      "Submit application through State Channelizing Agency (SCA) or NHFDC online portal.",
      "Attach UDID card, project plan, and KYC documents.",
      "District welfare committee verifies application and forwards to bank.",
      "Loan disbursed with rebate benefits for timely repayments."
    ]
  },
  {
    id: "atal-pension-yojana",
    name: "Atal Pension Yojana (APY - Guaranteed Pension for Unorganized Workers)",
    category: "Social Security",
    authority: "Central Government",
    ministry: "Pension Fund Regulatory and Development Authority (PFRDA), Ministry of Finance",
    state: "All India",
    objective: "Provide universal social security and a guaranteed monthly pension to workers in the unorganized sector upon reaching 60 years of age.",
    benefits: "Guaranteed minimum monthly pension of ₹1,000, ₹2,000, ₹3,000, ₹4,000, or ₹5,000 per month starting at age 60 for lifetime; same pension continues to spouse after subscriber's demise.",
    benefitType: "Social Pension",
    eligibility: {
      minAge: 18,
      maxAge: 40,
      maxIncome: 400000,
      gender: "All",
      occupation: ["All", "Laborer", "Farmer", "Street Vendor", "Domestic Worker", "Self-Employed", "Artisan"],
      category: ["All", "General", "OBC", "SC", "ST", "EWS"],
      minEducation: "None",
      disabilityRequired: false,
      maritalStatus: "All",
      requiresLand: false,
      requiresBpl: false,
      verificationConditions: [
        "Must hold an active savings bank account with auto-debit facility enabled",
        "Must not be an income-tax payer (as per rule effective Oct 1, 2022)"
      ],
      otherConditions: "Must join between ages 18 and 40 to contribute for at least 20 years."
    },
    requiredDocuments: [
      "Aadhaar Card",
      "Savings Bank Account Passbook",
      "Active Mobile number linked with bank account"
    ],
    officialUrl: "https://www.npscra.nsdl.co.in",
    sourceReference: "PFRDA Atal Pension Yojana Gazette Guidelines (npscra.nsdl.co.in / pfrda.org.in)",
    lastVerified: "October 2026",
    deadline: "Ongoing Scheme (Open Year-Round)",
    faqs: [
      { q: "What is the entry age limit?", a: "Subscribers must be between 18 and 40 years old at the time of joining." },
      { q: "Can an income-tax payer join?", a: "No, citizens who pay income tax are not eligible to join APY." }
    ],
    applicationProcedure: [
      "Visit the bank branch where you have an active savings account or net-banking portal.",
      "Fill APY Registration Form and choose desired monthly pension (₹1,000 to ₹5,000).",
      "Provide Aadhaar and nominee details.",
      "Authorize monthly auto-debit of subscription amount from savings account."
    ]
  },
  {
    id: "tn-pudhumai-penn",
    name: "Moovalur Ramamirtham Ammaiyar Pudhumai Penn Scheme",
    category: "Women & Child",
    authority: "State Government",
    ministry: "Social Welfare and Women Empowerment Department, Govt of Tamil Nadu",
    state: "Tamil Nadu",
    objective: "Prevent child marriage and encourage girl students from government schools to pursue higher undergraduate / diploma / professional education.",
    benefits: "Direct financial assistance of ₹1,000 per month credited directly into the girl student's bank account until completion of degree/diploma.",
    benefitType: "Direct Benefit Transfer",
    eligibility: {
      minAge: 17,
      maxAge: 25,
      maxIncome: 350000,
      gender: "Female",
      occupation: ["Student"],
      category: ["All", "General", "OBC", "SC", "ST", "EWS"],
      minEducation: "Class 12th Passed",
      disabilityRequired: false,
      maritalStatus: "Single",
      requiresLand: false,
      requiresBpl: false,
      verificationConditions: [
        "Must be a female resident of Tamil Nadu",
        "Must have studied continuously from Class 6th to Class 12th in Tamil Nadu Government Schools",
        "Must be currently enrolled in a recognized Higher Education Institution (UG / Diploma / ITI)"
      ],
      otherConditions: "Private school students are not eligible."
    },
    requiredDocuments: [
      "Aadhaar Card",
      "School Transfer Certificate (TC) confirming study in Govt Schools from 6th to 12th",
      "College Admission ID Card & Bonafide Certificate",
      "Bank Account details linked with Aadhaar",
      "Class 10th & 12th Marksheets"
    ],
    officialUrl: "https://www.pudhumaipenn.tn.gov.in",
    sourceReference: "Govt of Tamil Nadu Social Welfare Department (pudhumaipenn.tn.gov.in)",
    lastVerified: "October 2026",
    deadline: "Academic Year Window (30th November 2026)",
    faqs: [
      { q: "Are girls who studied in govt aided schools eligible?", a: "The scheme covers government schools (Corporation, Municipal, Adi Dravidar, Tribal Welfare, Forest schools)." }
    ],
    applicationProcedure: [
      "Visit the college nodal officer or login at pudhumaipenn.tn.gov.in.",
      "Enter EMIS number and School TC details.",
      "Complete Aadhaar e-KYC and bank verification.",
      "College principal verifies enrollment and forwards to District Social Welfare Officer."
    ]
  },
  {
    id: "ladli-behna-yojana",
    name: "Mukhyamantri Ladli Behna Yojana (Madhya Pradesh)",
    category: "Women & Child",
    authority: "State Government",
    ministry: "Women and Child Development Department, Govt of Madhya Pradesh",
    state: "Madhya Pradesh",
    objective: "Empower women financially, improve health and nutrition status of families, and support financial independence in rural and urban MP.",
    benefits: "Direct Monthly stipend of ₹1,250 transferred into women's Aadhaar-linked DBT bank account (₹15,000 per year).",
    benefitType: "Direct Benefit Transfer",
    eligibility: {
      minAge: 21,
      maxAge: 60,
      maxIncome: 250000,
      gender: "Female",
      occupation: ["Housewife", "Unemployed", "Laborer", "Farmer", "Self-Employed"],
      category: ["All", "General", "OBC", "SC", "ST", "EWS"],
      minEducation: "None",
      disabilityRequired: false,
      maritalStatus: "Married",
      requiresLand: false,
      requiresBpl: false,
      verificationConditions: [
        "Applicant must be a permanent resident of Madhya Pradesh",
        "Must possess valid Samagra ID with e-KYC completed",
        "Family income tax payers or government employees are excluded"
      ],
      otherConditions: "Widowed, divorced, and deserted women are also eligible."
    },
    requiredDocuments: [
      "Samagra Family ID & Member ID",
      "Aadhaar Card",
      "DBT-enabled Bank Account details",
      "MP Domicile Certificate / Residence Proof"
    ],
    officialUrl: "https://cmladlibehna.mp.gov.in",
    sourceReference: "Govt of Madhya Pradesh WCD Department (cmladlibehna.mp.gov.in)",
    lastVerified: "October 2026",
    deadline: "Monthly Batch Processing",
    faqs: [
      { q: "Can unmarried women apply?", a: "Scheme is for married, widowed, divorced, and deserted women aged 21-60." }
    ],
    applicationProcedure: [
      "Visit local Gram Panchayat or Ward Office camp.",
      "Provide Samagra ID and Aadhaar Card.",
      "Biometric e-KYC capture on spot.",
      "Application submitted and receipt provided with tracking ID."
    ]
  },
  {
    id: "cm-yuva-swarozgar",
    name: "Mukhyamantri Yuva Swarozgar Yojana (Uttar Pradesh)",
    category: "Business & Entrepreneurship",
    authority: "State Government",
    ministry: "Department of MSME and Export Promotion, Govt of Uttar Pradesh",
    state: "Uttar Pradesh",
    objective: "Provide financial assistance and margin money subsidy to educated unemployed youth in Uttar Pradesh to establish industrial and service enterprises.",
    benefits: "Bank loan up to ₹25 Lakhs for industrial sector and ₹10 Lakhs for service sector with 25% margin money government subsidy (up to ₹6.25 Lakhs).",
    benefitType: "Loan / Subsidy",
    eligibility: {
      minAge: 18,
      maxAge: 40,
      maxIncome: 400000,
      gender: "All",
      occupation: ["Unemployed", "Student", "Self-Employed", "Small Business Owner"],
      category: ["All", "General", "OBC", "SC", "ST", "EWS"],
      minEducation: "Class 10th Passed",
      disabilityRequired: false,
      maritalStatus: "All",
      requiresLand: false,
      requiresBpl: false,
      verificationConditions: [
        "Must be a permanent resident of Uttar Pradesh",
        "Must have passed High School (Class 10th) from a recognized board",
        "Must not be a defaulter with any financial institution"
      ],
      otherConditions: "Enterprise must be set up within the territory of Uttar Pradesh."
    },
    requiredDocuments: [
      "High School (Class 10th) Certificate / Marksheet",
      "UP Domicile Certificate",
      "Aadhaar Card & PAN Card",
      "Detailed Project Report (DPR)",
      "Bank Passbook"
    ],
    officialUrl: "https://diupmsme.upsdc.gov.in",
    sourceReference: "Directorate of Industries UP MSME Portal (diupmsme.upsdc.gov.in)",
    lastVerified: "October 2026",
    deadline: "Annual Financial Year Quota",
    faqs: [
      { q: "What is the margin money subsidy?", a: "25% of the total project cost is provided as non-refundable margin money subsidy by the UP Govt." }
    ],
    applicationProcedure: [
      "Register on DIUP MSME Portal (diupmsme.upsdc.gov.in).",
      "Select 'Mukhyamantri Yuva Swarozgar Yojana'.",
      "Upload DPR, High School Certificate, and Domicile Proof.",
      "Attend District Level Task Force Committee (DLTFC) interview.",
      "Loan sanctioned and subsidy credited upon enterprise setup."
    ]
  },
  {
    id: "national-social-assistance-widow-pension",
    name: "Indira Gandhi National Widow Pension Scheme (IGNWPS)",
    category: "Social Security",
    authority: "Central Government",
    ministry: "Ministry of Rural Development",
    state: "All India",
    objective: "Provide social security and monthly financial assistance to widows living below the poverty line.",
    benefits: "Monthly pension of ₹500 to ₹1,500 directly deposited into bank account via DBT (central grant supplemented by state top-ups).",
    benefitType: "Social Pension",
    eligibility: {
      minAge: 40,
      maxAge: 79,
      maxIncome: 180000,
      gender: "Female",
      occupation: ["Unemployed", "Housewife", "Laborer"],
      category: ["All", "General", "OBC", "SC", "ST", "EWS"],
      minEducation: "None",
      disabilityRequired: false,
      maritalStatus: "Widowed",
      requiresLand: false,
      requiresBpl: true,
      verificationConditions: [
        "Applicant must be a widow aged between 40 and 79 years",
        "Must belong to a household listed Below the Poverty Line (BPL) as per SECC / State BPL list"
      ],
      otherConditions: "Upon reaching 80 years, the beneficiary automatically transitions to National Old Age Pension Scheme with higher rate."
    },
    requiredDocuments: [
      "Death Certificate of Husband",
      "Aadhaar Card",
      "BPL Ration Card / BPL Survey Certificate",
      "Aadhaar-linked Bank Account Passbook",
      "Age Proof"
    ],
    officialUrl: "https://nsap.nic.in",
    sourceReference: "National Social Assistance Programme Guidelines (nsap.nic.in)",
    lastVerified: "October 2026",
    deadline: "Ongoing Scheme (Open Year-Round)",
    faqs: [
      { q: "What if the widow remarries?", a: "The pension terminates upon remarriage as per NSAP rules." }
    ],
    applicationProcedure: [
      "Submit application to the local Tehsil office, Block Development Officer (BDO), or Urban Local Body.",
      "Attach husband's death certificate, BPL card, and Aadhaar.",
      "Verification conducted by Village Development Officer (VDO) or Revenue Inspector.",
      "Sanctioned pension disbursed directly into bank account every month."
    ]
  }
];
