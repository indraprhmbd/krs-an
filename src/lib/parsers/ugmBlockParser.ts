/**
 * Parser for UGM's copy-pasted course table: one course per multi-line block,
 * no prodi column, numbered lecturers ("1.", "2.", ...) that can span several
 * lines, and the day/time trailing whichever line holds the last lecturer (or
 * absent entirely for non-scheduled items like Kerja Praktek). Example:
 *
 *   5	TKF210058  Penerapan Mikroprosesor
 *     Kelas: FA	2	0		1. Prof. Nazrul Effendy, S.T., MT.,Ph.D.	Rabu, 13:00-14:40
 *
 * This is structurally unlike the column-count-based line format
 * IntelligenceScraperDialog.tsx's handleManualParse expects, so it is parsed
 * block-by-block instead. Output matches ParsedMasterCourse exactly so it can
 * be handed straight to api.admin.bulkImportMaster with no further mapping.
 */

export interface ParsedMasterCourse {
  code: string;
  name: string;
  sks: number;
  prodi: string;
  class: string;
  lecturer: string;
  room: string;
  schedule: { day: string; start: string; end: string }[];
}

const HEADER_RE = /^\d+\t(\S+)\s{2,}(.+)$/;
const KELAS_RE = /^Kelas:\s*(\S+)\t(\d+)\t\d+\t*(.*)$/;
const LECTURER_RE = /\d+\.\s*([^\t\n]+)/g;
const SCHEDULE_RE =
  /(Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu),\s*(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/;

const DAY_MAP: Record<string, string> = {
  senin: "Mon",
  selasa: "Tue",
  rabu: "Wed",
  kamis: "Thu",
  jumat: "Fri",
  sabtu: "Sat",
  minggu: "Sun",
};

interface Block {
  code: string;
  name: string;
  class: string;
  sks: number;
  remainder: string;
}

function extractLecturer(remainder: string): string {
  const matches = [...remainder.matchAll(LECTURER_RE)].map((m) =>
    m[1].trim(),
  );
  return matches.length > 0 ? matches.join(", ") : "-";
}

function extractSchedule(
  remainder: string,
): { day: string; start: string; end: string }[] {
  const match = remainder.match(SCHEDULE_RE);
  if (!match) return [];
  const day = DAY_MAP[match[1].toLowerCase()] ?? match[1];
  return [{ day, start: match[2], end: match[3] }];
}

function finalizeBlock(block: Block, prodi: string): ParsedMasterCourse {
  return {
    code: block.code,
    name: block.name,
    sks: block.sks,
    prodi,
    class: block.class,
    lecturer: extractLecturer(block.remainder),
    room: "-",
    schedule: extractSchedule(block.remainder),
  };
}

export function parseUgmBlockFormat(
  rawText: string,
  prodi: string,
): ParsedMasterCourse[] {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const results: ParsedMasterCourse[] = [];
  let current: Block | null = null;

  for (const line of lines) {
    const header = line.match(HEADER_RE);
    if (header) {
      if (current) results.push(finalizeBlock(current, prodi));
      current = { code: header[1], name: header[2], class: "", sks: 0, remainder: "" };
      continue;
    }

    const kelas = line.match(KELAS_RE);
    if (kelas && current) {
      current.class = kelas[1];
      current.sks = parseInt(kelas[2], 10) || 0;
      current.remainder += kelas[3] + "\n";
      continue;
    }

    if (current) {
      current.remainder += line + "\n";
    }
  }

  if (current) results.push(finalizeBlock(current, prodi));

  return results;
}
