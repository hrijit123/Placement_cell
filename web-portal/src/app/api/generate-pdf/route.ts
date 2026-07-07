import { NextResponse } from "next/server";
import axios from "axios";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { name, headline, education, experience, skills } = data;
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Escape LaTeX special characters
    const escapeLatex = (str: string) => {
      if (!str) return "";
      return str
        .replace(/\\/g, "\\textbacklash{}")
        .replace(/{/g, "\\{")
        .replace(/}/g, "\\}")
        .replace(/_/g, "\\_")
        .replace(/\^/g, "\\textasciicircum{}")
        .replace(/~/g, "\\textasciitilde{}")
        .replace(/&/g, "\\&")
        .replace(/%/g, "\\%")
        .replace(/\$/g, "\\$")
        .replace(/#/g, "\\#");
    };

    // Construct the LaTeX template
    const texDocument = `
\\documentclass[11pt,a4paper,sans]{moderncv}
\\moderncvstyle{classic}
\\moderncvcolor{grey}
\\usepackage[scale=0.8]{geometry}

\\name{${escapeLatex(name.split(' ')[0] || '')}}{${escapeLatex(name.split(' ').slice(1).join(' ') || '')}}
\\title{${escapeLatex(headline)}}

\\begin{document}
\\makecvtitle

\\section{Experience}
${escapeLatex(experience).split('\\n').filter((l: string) => l.trim().length > 0).map((line: string) => {
  // If AI generated bullet points starting with *, - or •, clean them up and use cvitem
  const cleanedLine = line.replace(/^[-*•]\\s*/, '');
  return `\\cvitem{}{${cleanedLine}}`;
}).join('\\n')}

\\section{Education}
\\cvitem{}{${escapeLatex(education).replace(/\\n/g, '\\newline ')}}

\\section{Skills}
\\cvitem{}{${escapeLatex(skills)}}

\\end{document}
`;

    // Compile the LaTeX document using latexonline.cc
    const response = await axios.post('https://latexonline.cc/compile', texDocument, {
      headers: {
        'Content-Type': 'text/plain'
      },
      responseType: 'arraybuffer' // We want the binary PDF
    });

    // Return the PDF to the client
    return new NextResponse(response.data, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${name.replace(/\\s+/g, "_")}_Resume.pdf"`
      }
    });

  } catch (error) {
    console.error("PDF Generation Error:", error);
    return NextResponse.json({ error: "Failed to compile LaTeX to PDF" }, { status: 500 });
  }
}
