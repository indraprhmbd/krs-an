import { Course } from "../types";

export function validateCoursesJSON(data: any): data is Course[] {
  if (!Array.isArray(data)) return false;

  return data.every(
    (course) =>
      typeof course.id === "string" &&
      typeof course.code === "string" &&
      typeof course.name === "string" &&
      typeof course.sks === "number" &&
      Array.isArray(course.schedule) &&
      course.schedule.every(
        (s: any) =>
          typeof s.day === "string" &&
          typeof s.start === "string" &&
          typeof s.end === "string",
      ),
  );
}

export function downloadJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function parseJSONFile(file: File): Promise<Course[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (validateCoursesJSON(json)) {
          resolve(json);
        } else {
          reject(
            new Error("Invalid JSON format. Please use the exported format."),
          );
        }
      } catch (err) {
        reject(new Error("Failed to parse JSON file."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsText(file);
  });
}
