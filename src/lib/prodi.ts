export interface ProdiConfig {
  isCourseCentric: boolean; // Simplified UI (hides lecturer)
  isFloatingDay: boolean; // Reserved for future: courses with user-selectable days
}

export const PRODI_CONFIGS: Record<string, ProdiConfig> = {
  "TEKNIK PERTAMBANGAN": {
    isCourseCentric: true,
    isFloatingDay: false,
  },
};

export function getProdiConfig(prodiName: string): ProdiConfig {
  if (!prodiName) return { isCourseCentric: false, isFloatingDay: false };
  const normalized = prodiName.toUpperCase().trim().replace(/\.$/, "");
  return (
    PRODI_CONFIGS[normalized] || {
      isCourseCentric: false,
      isFloatingDay: false,
    }
  );
}
