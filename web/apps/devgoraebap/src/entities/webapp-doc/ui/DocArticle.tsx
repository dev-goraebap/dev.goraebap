import { Fragment } from "react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@goraebap/ui-react/components/badge";
import { buttonVariants } from "@goraebap/ui-react/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@goraebap/ui-react/components/table";
import { SystemIcon } from "@goraebap/ui-react/icons";
import { MermaidDiagram } from "@/shared/ui";
import type { GuideDoc } from "../model/catalog";

interface DocLink {
  title: string;
  href: string;
}

export function DocArticle({
  doc,
  prevDoc,
  nextDoc,
}: {
  doc: GuideDoc & { group: string };
  prevDoc?: DocLink;
  nextDoc?: DocLink;
}) {
  const sections = doc.sections.filter((section) => section.paragraphs.length > 0);
  const isWritten = sections.length > 0;

  return (
    <article className="max-w-3xl space-y-8">
      <header className="border-border space-y-3 border-b pb-8">
        <p className="text-muted-foreground text-sm font-medium">{doc.group}</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{doc.title}</h1>
          {!isWritten && <Badge variant="secondary">작성 중</Badge>}
        </div>
        <p className="text-muted-foreground text-lg leading-relaxed">{doc.summary}</p>
      </header>

      {isWritten ? (
        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24 space-y-4">
              {section.title && (
                <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
              )}
              {section.paragraphs.map((paragraph, index) => (
                <Fragment key={`${section.id}-${index}`}>
                  <p className="text-foreground/90 text-base leading-7">{paragraph}</p>
                  {section.bullets?.after === index && (
                    <ul className="text-foreground/90 list-disc space-y-2 pl-5 text-base leading-7">
                      {section.bullets.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {section.callout?.after === index && (
                    <aside className="border-foreground/25 bg-muted/40 space-y-1.5 rounded-r-xl border-l-2 px-4 py-3.5">
                      {section.callout.title && (
                        <p className="text-foreground text-sm font-semibold">
                          {section.callout.title}
                        </p>
                      )}
                      <p className="text-muted-foreground text-sm leading-6">
                        {section.callout.body}
                      </p>
                    </aside>
                  )}
                  {section.example?.after === index && (
                    <figure className="border-border bg-card overflow-hidden rounded-xl border">
                      <div className="border-border bg-muted/40 border-b px-4 py-2">
                        <span className="text-muted-foreground font-mono text-xs">
                          {section.example.label}
                        </span>
                      </div>
                      <pre className="text-foreground/90 overflow-x-auto p-4 font-mono text-xs leading-relaxed">
                        <code>{section.example.code}</code>
                      </pre>
                      {section.example.caption && (
                        <figcaption className="border-border text-muted-foreground border-t px-4 py-2.5 text-xs">
                          {section.example.caption}
                        </figcaption>
                      )}
                    </figure>
                  )}
                  {section.diagram?.after === index && (
                    <MermaidDiagram code={section.diagram.code} caption={section.diagram.caption} />
                  )}
                  {section.table?.after === index && (
                    <div className="border-border overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {section.table.columns.map((column) => (
                              <TableHead key={column}>{column}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {section.table.rows.map((row) => (
                            <TableRow key={row[0]}>
                              {row.map((cell, cellIndex) => (
                                <TableCell key={`${row[0]}-${cellIndex}`} className="text-sm">
                                  {cellIndex === 0 && section.table?.monoFirstColumn ? (
                                    <code className="font-mono text-xs">{cell}</code>
                                  ) : (
                                    cell
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </Fragment>
              ))}
            </section>
          ))}
        </div>
      ) : (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">다룰 내용</h2>
          <ul className="border-border divide-border divide-y rounded-lg border">
            {doc.sections.map((section) => (
              <li key={section.id} className="px-4 py-3 text-base">
                {section.title}
              </li>
            ))}
          </ul>
        </section>
      )}

      {doc.next &&
        (doc.next.to ? (
          <div>
            <Link to={doc.next.to} className={buttonVariants({ variant: "outline" })}>
              {doc.next.label}
              <SystemIcon name="arrowRight" className="size-4" />
            </Link>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{doc.next.label}</p>
        ))}

      {doc.references && doc.references.length > 0 && (
        <section className="border-border space-y-4 border-t pt-8">
          <h2 className="text-xl font-semibold tracking-tight">참고 자료</h2>
          <ul className="space-y-3">
            {doc.references.map((reference) => (
              <li key={reference.href} className="text-sm leading-relaxed">
                <a
                  href={reference.href}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline underline-offset-4"
                >
                  {reference.title}
                </a>
                <span className="text-muted-foreground"> · {reference.source}</span>
                {reference.note && <p className="text-muted-foreground mt-0.5">{reference.note}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(prevDoc || nextDoc) && (
        <nav
          aria-label="이전 및 다음 문서"
          className="border-border grid gap-3 border-t pt-6 sm:grid-cols-2"
        >
          {prevDoc ? (
            <Link
              to={prevDoc.href}
              className="border-border hover:bg-accent/50 group flex flex-col gap-1 rounded-xl border px-4 py-3 transition-colors"
            >
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <SystemIcon name="chevronLeft" className="size-3.5" />
                이전
              </span>
              <span className="text-foreground text-sm font-medium">{prevDoc.title}</span>
            </Link>
          ) : (
            <div />
          )}
          {nextDoc && (
            <Link
              to={nextDoc.href}
              className="border-border hover:bg-accent/50 group flex flex-col items-end gap-1 rounded-xl border px-4 py-3 text-right transition-colors"
            >
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                다음
                <SystemIcon name="chevronRight" className="size-3.5" />
              </span>
              <span className="text-foreground text-sm font-medium">{nextDoc.title}</span>
            </Link>
          )}
        </nav>
      )}
    </article>
  );
}
