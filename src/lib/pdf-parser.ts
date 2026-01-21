// Use dynamic import to avoid bundling pdfjs-dist in the main chunk
// import * as pdfjsLib from "pdfjs-dist";

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      // Simple join with space.
      // Improved logic: try to preserve some structure?
      // For now, raw text dump is fine for LLM to parse.
      const pageText = textContent.items.map((item: any) => item.str).join(" "); // Adding spaces between items

      fullText += `--- Page ${i} ---\n${pageText}\n\n`;
    }

    return fullText;
  } catch (error) {
    console.error("PDF Parsing Error", error);
    throw new Error("Failed to parse PDF");
  }
}
