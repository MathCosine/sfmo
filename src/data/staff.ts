export type StaffMember = {
  /** Used for the photo filename: public/team/<slug>.jpg */
  slug: string;
  name: string;
  boardTitle: string;
  roles: string[];
  isBoard: boolean;
  /** object-position for the portrait crop */
  photoPosition?: string;
  /** Portrait is letterboxed rather than cropped (for non-standard sources). */
  photoContain?: boolean;
  bio: string;
};

export const staff: StaffMember[] = [
  {
    slug: 'thomas',
    name: 'Zi-Jie (Thomas) Ni',
    boardTitle: 'President',
    roles: ['President', 'Tech Lead'],
    isBoard: true,
    photoPosition: '50% 38%',
    bio: "Thomas Ni is a high schooler who has loved mathematics for a long time, and has earned recognition in math competitions along the way. He especially enjoys combinatorics problems. When he is not doing mathematics, you can find him playing basketball, pondering the world's big questions, consuming apples, reading a book, or talking with friends.",
  },
  {
    slug: 'seojin',
    name: 'Seojin Lee',
    boardTitle: 'Vice President',
    roles: ['Vice President', 'Treasurer'],
    isBoard: true,
    photoPosition: '50% 20%',
    bio: 'Seojin Lee is a freshman at Cupertino High School whose passion for mathematics began in 7th grade, when he earned an Honor Roll distinction on the AMC 8. Since then, he has participated in numerous competitive math programs and contests, including the AMC 10, SMT, and BMMT. He is especially recognized for his strong attention to detail and analytical thinking, often identifying flaws in solutions that others overlook.',
  },
  {
    slug: 'ella',
    name: 'Ella Feng',
    boardTitle: 'Secretary & Treasurer',
    roles: ['Secretary', 'Treasurer', 'Head of Academy'],
    isBoard: true,
    photoPosition: '50% 30%',
    bio: "Ella Feng is a student from Los Altos High School's class of 2030. She is a math enthusiast with a particular passion for combinatorics problems and distaste towards algebra. Outside of math, she can often be found partaking in other hobbies such as playing the violin and crocheting, or spending time with her British Shorthair cat.",
  },
  {
    slug: 'alexander',
    name: 'Alexander Braun',
    boardTitle: 'Head of Academy',
    roles: ['Head of Academy'],
    isBoard: true,
    photoPosition: '50% 25%',
    bio: "Alexander genuinely loves math, and — more unusually — he genuinely loves teaching it. He has that rare gift for making a hard idea feel inevitable: explaining something in a way that makes you wonder how you didn't see it before. His problems are fair, carefully crafted, and rewarding for students who put in the work. He's also passionate about broadening access to competitive math, which is exactly the kind of person SFMO wants building it.",
  },
  {
    slug: 'ethan',
    name: 'Ethan Sun',
    boardTitle: 'Head Problem Writer',
    roles: ['Head Problem Writer', 'Design', 'Logistics'],
    isBoard: true,
    photoPosition: '50% 20%',
    bio: "Ethan has the organizational instincts of a logistics general and the mathematical taste to match. He manages to make everything run smoothly and look good simultaneously — a combination that should be impossible but apparently isn't. His design eye means SFMO's materials are as polished as the problems inside them. We keep waiting for something to fall through the cracks. So far, nothing has. We suspect nothing will.",
  },
  {
    slug: 'rylan',
    name: 'Rylan Zhang',
    boardTitle: 'Curriculum Director',
    roles: ['Curriculum Director'],
    isBoard: true,
    photoPosition: '50% 22%',
    bio: "Rylan has an uncanny instinct for number theory — the kind where structure materializes in a problem before most people have finished reading the statement. He also somehow keeps SFMO operationally intact, which requires a completely different kind of intelligence. Fortunately, he appears to have both. He's genuinely excited to contribute problems that will haunt your dreams in the best possible way, and we mean that as high praise.",
  },
  {
    slug: 'temujin',
    name: 'Temujin Battulga',
    boardTitle: 'Head of Promotion',
    roles: ['Public Relations', 'Head of Promotion'],
    isBoard: true,
    photoPosition: '50% 20%',
    bio: "Temujin Battulga is a combinatorics main, a certified geo hater, and part of the Gunn High School graduating class of 2030. He also codes in C++, which he describes to be, 'the best language, no room for discussion'. When not doing math or coding (which is basically all the time), you'll find him laddering on Pokémon Showdown, playing piano, and being chronically online. We are not joking about the chronically online part, DM him and he will probably respond within a minute or two (this has been tested and verified).",
  },
  {
    slug: 'william',
    name: 'William Tao',
    boardTitle: 'Problem Writer',
    roles: ['Problem Writer', 'MathCounts National Qualifier', 'Quality Control'],
    isBoard: false,
    photoPosition: '50% 20%',
    bio: "William qualified for MathCounts Nationals out of California — a sentence that tells you most of what you need to know about his problem-solving instincts. He has a particular fondness for combinatorics, which he approaches with genuine creativity and, when the situation calls for it, a willingness to casework his way through every possible configuration. He calls this 'thorough.' We call it 'a William problem.' Both are accurate. The answers come out right, and that's what counts.",
  },
];

export const boardMembers = staff.filter((member) => member.isBoard);
export const contributors = staff.filter((member) => !member.isBoard);
