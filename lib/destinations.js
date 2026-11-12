const entry = (title, level, type, detail, url) => ({ title, level, type, detail, url });

export const cities = [
  {
    id: 'tokyo', code: 'TYO', name: 'Tokyo', country: 'Japan', lat: 35.68, lon: 139.69,
    photoCredit: { label: 'Unsplash · Tokyo Tower', url: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc' },
    landmark: 'Tokyo Tower', coordinates: '35.68° N / 139.69° E', color: '#EFA7D9',
    intro: 'Explore a city where universities, research labs, and student neighbourhoods sit along the same rail lines.',
    life: 'Compare housing and travel time around your actual campus. Check the teaching language for the full degree, and plan for everyday Japanese even if your course is taught in English.',
    first: 'For MEXT, start with the Embassy of Japan in India. For direct admission, check the university’s current undergraduate route separately.',
    opportunities: [
      entry('MEXT Undergraduate Scholarship', 'Undergraduate', 'Scholarship', 'The embassy recommendation route for applicants from India. Read the current call for subject streams, eligibility and funding.', 'https://www.in.emb-japan.go.jp/Education/Undergraduate_Student.html'),
      entry('The University of Tokyo undergraduate admissions', 'Undergraduate', 'Degree pathway', 'Compare admissions categories and teaching language before choosing an application route.', 'https://www.u-tokyo.ac.jp/en/prospective-students/undergraduate.html'),
      entry('JASSO scholarship information', 'Multiple levels', 'Funding directory', 'Explore funding for international students, with award and nomination criteria on each programme page.', 'https://www.jasso.go.jp/en/ryugaku/scholarship_j/index.html'),
    ],
  },
  {
    id: 'london', code: 'LON', name: 'London', country: 'United Kingdom', lat: 51.51, lon: -0.13,
    photoCredit: { label: 'Jacob Diehl on Unsplash', url: 'https://unsplash.com/photos/the-big-ben-clock-tower-towering-over-the-city-of-london-d80dS3gesa8' },
    landmark: 'Big Ben and Westminster', coordinates: '51.51° N / 0.13° W', color: '#CB92EF',
    intro: 'Build a London shortlist around courses, campuses, and funding you can realistically plan for.',
    life: 'London campuses span several boroughs. Compare accommodation and commute costs alongside tuition. Check course-level requirements early, particularly for programmes with admissions tests, interviews, or portfolios.',
    first: 'Use UCAS to map the application. Check the university’s own pages for course requirements, international qualifications, and funding.',
    opportunities: [
      entry('UCAS undergraduate applications', 'Undergraduate', 'Application pathway', 'Start here for the shared UK application process. Check the deadline for your specific course and cycle.', 'https://www.ucas.com/faqs/how-do-i-apply'),
      entry('UCL Global Undergraduate Scholarship', 'Undergraduate', 'Scholarship', 'A funding route for eligible overseas undergraduates from lower-income backgrounds. Confirm awards and requirements for your entry year.', 'https://www.ucl.ac.uk/scholarships/ucl-global-undergraduate-scholarship'),
      entry('Imperial undergraduate admissions', 'Undergraduate', 'Degree pathway', 'Research STEM and related courses and check subject, test, and interview requirements on each course page.', 'https://www.imperial.ac.uk/study/help-centre/undergraduate-admissions/how-do-i-apply-for-undergraduate-study.php'),
    ],
  },
  {
    id: 'paris', code: 'PAR', name: 'Paris', country: 'France', lat: 48.86, lon: 2.35,
    photoCredit: { label: 'Unsplash · Eiffel Tower', url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34' },
    landmark: 'Eiffel Tower', coordinates: '48.86° N / 2.35° E', color: '#ED92C4',
    intro: 'Find your starting point for France, from undergraduate routes to postgraduate funding.',
    life: 'Compare the language of instruction with the language you’ll need for housing, daily life, and internships. Check the exact campus location and degree title before shortlisting.',
    first: 'Begin with Campus France India. Look up the individual institution’s application route before preparing transcripts or language certificates.',
    opportunities: [
      entry('Campus France India', 'Multiple levels', 'Application pathway', 'Explore official guidance for students applying from India and check which procedure applies to your course.', 'https://www.inde.campusfrance.org/'),
      entry('Sciences Po bachelor’s admissions', 'Undergraduate', 'Degree pathway', 'Research the undergraduate college and check campus and track options, language, and your admissions pathway.', 'https://www.sciencespo.fr/admissions/en/undergraduate/foreign-secondary-schools/'),
      entry('France Excellence Eiffel Scholarship', 'Master’s and doctoral', 'Scholarship', 'A graduate funding route with applications submitted by French institutions. Ask your institution about its nomination process.', 'https://www.campusfrance.org/en/france-excellence-eiffel-scholarship-program'),
    ],
  },
  {
    id: 'berlin', code: 'BER', name: 'Berlin', country: 'Germany', lat: 52.52, lon: 13.40,
    photoCredit: { label: 'Unsplash · Brandenburg Gate', url: 'https://images.unsplash.com/photo-1560969184-10fe8719e047' },
    landmark: 'Brandenburg Gate', coordinates: '52.52° N / 13.40° E', color: '#A293F5',
    intro: 'Explore engineering, science, and interdisciplinary study in Berlin. Start by checking your qualification route and course language.',
    life: 'Compare German- and English-taught programmes and read the programme’s language requirements. Check semester contributions, housing availability, and each campus location.',
    first: 'Use DAAD to understand your qualification route, then check the exact application instructions at the university.',
    opportunities: [
      entry('TU Berlin first-semester application, Group C', 'Undergraduate', 'Degree pathway', 'Read the route for open-admission courses and check the separate rules for restricted-admission degrees.', 'https://www.tu.berlin/en/studierendensekretariat/bachelors-application-enrollment/prospective-students-with-an-international-higher-education-entrance-qualification/application/group-c'),
      entry('DAAD scholarship database', 'Multiple levels', 'Funding directory', 'Filter by country of origin, subject, and academic level. Many awards serve graduate or research applicants.', 'https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/'),
      entry('Freie Universität Berlin undergraduate admissions', 'Undergraduate', 'Degree pathway', 'Check subject availability, qualification requirements, and language certification with the institution.', 'https://www.fu-berlin.de/en/studium/bewerbung/bachelor/index.html'),
    ],
  },
  {
    id: 'new-york', code: 'NYC', name: 'New York', country: 'United States', lat: 40.71, lon: -74.01,
    photoCredit: { label: 'Unsplash · Manhattan', url: 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee' },
    landmark: 'Empire State Building and Manhattan', coordinates: '40.71° N / 74.01° W', color: '#65B8F1',
    intro: 'Compare New York’s universities and aid policies before building a US college list.',
    life: 'Look at total cost and housing location, then check each school’s aid policy for international applicants. Application platforms, essays, testing, and financial aid deadlines can vary by institution.',
    first: 'Use EducationUSA to map the process, then build a calendar around official admissions and financial aid pages.',
    opportunities: [
      entry('EducationUSA research guide', 'Multiple levels', 'Application pathway', 'Start with the U.S. Department of State guide to researching institutions and explore its related application and funding steps.', 'https://educationusa.state.gov/your-5-steps-us-study/research-your-options'),
      entry('NYU undergraduate admissions FAQ', 'Undergraduate', 'Degree pathway', 'Check first-year requirements and campus-specific options, then review aid separately.', 'https://connect.nyu.edu/register/ugadmfaq'),
      entry('Columbia international undergraduate aid', 'Undergraduate', 'Financial aid', 'Review Columbia’s international applicant aid policies and its application process.', 'https://cc-seas.financialaid.columbia.edu/how/aid/works/international'),
    ],
  },
  {
    id: 'singapore', code: 'SIN', name: 'Singapore', country: 'Singapore', lat: 1.35, lon: 103.82,
    photoCredit: { label: 'Unsplash · Marina Bay', url: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd' },
    landmark: 'Marina Bay Sands', coordinates: '1.35° N / 103.82° E', color: '#63D9DC',
    intro: 'Explore Singapore’s university routes and see which funding options match your qualifications.',
    life: 'Check which application category matches your school qualifications. Compare halls, campus travel, and the conditions attached to any grant or award before committing.',
    first: 'Open the NUS and NTU qualification pages for your school credential. Read scholarship eligibility and any service obligations on the official terms.',
    opportunities: [
      entry('NUS international qualifications', 'Undergraduate', 'Degree pathway', 'Check the admissions category for your school qualifications and verify course prerequisites.', 'https://nus.edu.sg/oam/admissions/international-qualifications'),
      entry('NUS International Undergraduate Scholarship', 'Undergraduate', 'Scholarship', 'Review selection criteria, award coverage, and any associated Tuition Grant obligations on the official page.', 'https://nus.edu.sg/oam/scholarships/freshmen-international-students/nus-international-undergraduate-scholarship'),
      entry('NTU international qualifications', 'Undergraduate', 'Degree pathway', 'Check requirements and document deadlines for your qualification category.', 'https://www.ntu.edu.sg/admissions/undergraduate/admission-guide/international-qualifications'),
    ],
  },
];

export const launchPoint = { name: 'Guwahati', code: 'GAU', lat: 26.14, lon: 91.74 };
export const cityById = id => cities.find(city => city.id === id);
