export type Resource = {
  title: string;
  url: string;
  highlight?: boolean;
};

export const resources: Resource[] = [
  {
    title: 'San Francisco Math Academy — 1-on-1 Tutoring & Summer Camp',
    url: 'https://sfmathacademy.replit.app/',
    highlight: true,
  },
  {
    title: 'AwesomeMath Books (CleverMath Series)',
    url: 'https://www.awesomemath.org/',
  },
  {
    title: 'Art of Problem Solving (AoPS) Books',
    url: 'https://artofproblemsolving.com/store',
  },
  {
    title: 'Past AMC Contests',
    url: 'https://artofproblemsolving.com/wiki/index.php/AMC_Problems_and_Solutions',
  },
  {
    title: 'Past AIME Contests',
    url: 'https://artofproblemsolving.com/wiki/index.php/AIME_Problems_and_Solutions',
  },
];

export const advancedResources: Resource[] = [
  {
    title: 'Problems from the Book by Titu Andreescu',
    url: 'https://www.awesomemath.org/product/problems-from-the-book-3rd-editon/',
  },
  {
    title: 'Calculus CD by Titu Andreescu',
    url: 'https://www.awesomemath.org/product/calculus-cd-book-1/',
  },
];

export type ProblemSet = {
  title: string;
  description: string;
  /** Local file under public/docs, or an external URL. Null = not published yet. */
  href: string | null;
  actionLabel: string;
};

export const problemSets: ProblemSet[] = [
  {
    title: 'San Francisco Math Open 2026 Problems',
    description: 'Download official problem sets from the inaugural San Francisco Math Open.',
    href: 'https://drive.google.com/file/d/1KmMq9w-4u3ETiwx3ryirkAvgiuDPgoeJ/view',
    actionLabel: 'Download PDF',
  },
  {
    title: 'San Francisco Math Open 2026 Shortlist',
    description: "Check out the shortlisted problems for this year's competition!",
    // NOTE: this is currently the same Drive file as the problem set above —
    // the two links given to us were identical. Needs the real shortlist URL.
    href: 'https://drive.google.com/file/d/1KmMq9w-4u3ETiwx3ryirkAvgiuDPgoeJ/view',
    actionLabel: 'View Shortlist',
  },
  {
    title: 'More Coming Soon',
    description: 'Stay tuned for more educational resources and training materials.',
    href: null,
    actionLabel: 'Coming Soon',
  },
];
