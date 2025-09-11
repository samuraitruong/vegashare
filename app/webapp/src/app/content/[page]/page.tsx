import fs from "fs";
import path from "path";
import React from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

function readMarkdownFile(slug: string): string | null {
  const baseDir = path.resolve(process.cwd(), "content");
  const filePath = path.join(baseDir, `${slug}.md`);
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  const baseDir = path.resolve(process.cwd(), "content");
  let files: string[] = [];
  try {
    files = fs.readdirSync(baseDir);
  } catch {
    files = [];
  }
  return files
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({ page: f.replace(/\.md$/, "") }));
}

const mdComponents: Components = {
  a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
  table: (props) => (
    <div className="overflow-x-auto">
      <table {...props} />
    </div>
  ),
  code: (props) => {
    const className = (props as { className?: string }).className || "";
    const children = (props as { children?: React.ReactNode }).children;
    const text = Array.isArray(children) ? children.join("") : (children as string) || "";
    const isBlock = typeof text === "string" && text.includes("\n");
    if (isBlock) {
      return (
        <pre className="p-4 rounded bg-gray-900 text-gray-100 overflow-auto">
          <code className={className}>{children}</code>
        </pre>
      );
    }
    return (
      <code className={"px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 " + className}>{children}</code>
    );
  }
};

export default async function ContentPage({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const md = readMarkdownFile(page);
  if (!md) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 md:p-8">
            <h1 className="text-2xl font-bold text-gray-900">Not found</h1>
            <p className="text-gray-600 mt-2">The requested content could not be found.</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <article className="prose prose-slate max-w-none prose-headings:text-gray-900 prose-a:text-blue-600 prose-strong:text-gray-900 bg-white text-gray-800 rounded-xl shadow-md border border-gray-200 p-6 md:p-8">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[[rehypeSlug], [rehypeAutolinkHeadings, { behavior: "wrap" }]]}
            components={mdComponents}
          >
            {md}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
