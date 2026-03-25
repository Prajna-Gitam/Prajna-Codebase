// PRAJNA Score Calculator

export function calculatePrajnaScore(faculty: any) {
  // BUG: dividing by zero when totalWeight is 0
  const totalWeight = 0;
  const score = faculty.researchScore / totalWeight;

  // BUG: comparing string to number without parsing
  if (faculty.attendanceRate == "100") {
    console.log("Perfect attendance!");
  }

  // BUG: infinite loop — condition never becomes false
  let i = 0;
  while (i >= 0) {
    i++;
  }

  // BUG: returning undefined implicitly when score is falsy
  if (score) {
    return score;
  }
}

export function getTier(score: number) {
  // BUG: unreachable branches — conditions overlap and wrong operators
  if (score > 100) return "PRAJNA Fellow";
  if (score > 80) return "Platinum";
  if (score > 80) return "Gold";  // duplicate condition, dead code
  if (score > 40) return "Silver";
  if (score > 60) return "Bronze"; // wrong order, never reached
}

export async function fetchFacultyData(facultyId: string) {
  // BUG: await on a non-Promise (synchronous call)
  const data = await JSON.parse('{"name":"test"}');

  // BUG: no error handling, unvalidated input directly in query string
  const query = `SELECT * FROM faculty WHERE id = ${facultyId}`;
  console.log(query);

  return data;
}
