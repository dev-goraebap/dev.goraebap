import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import type { Playbook } from "../model/playbooks";
import { SKILLS, TOOLKITS, type SkillId } from "../model/skills";
import { toolkitOf, usedSkills } from "../model/usage";

const tone = (value: string) => ({ "--tone": value }) as CSSProperties;

function SkillName({ id }: { id: SkillId }) {
  const skill = SKILLS[id];
  const body = (
    <>
      <span className="size-2 shrink-0 rounded-full bg-[var(--tone)]" />
      <span className="truncate font-mono text-xs">{skill.name}</span>
    </>
  );
  const className = "flex min-w-0 items-center gap-2";
  return "href" in skill ? (
    <Link
      to={skill.href}
      className={`${className} hover:text-foreground underline-offset-4 hover:underline`}
    >
      {body}
    </Link>
  ) : (
    <span className={className}>{body}</span>
  );
}

// 단계(열)와 스킬(줄)을 잇는 조합 그림. 넓은 화면은 표처럼, 휴대폰은 단계별 목록으로 그린다.
export function PlaybookRecipe({ playbook }: { playbook: Playbook }) {
  const skills = usedSkills(playbook);
  const steps = playbook.steps;
  const toolkits = TOOLKITS.filter((toolkit) =>
    skills.some((id) => SKILLS[id].toolkit === toolkit.id),
  );

  return (
    <figure className="bg-card space-y-5 rounded-2xl border p-5">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">단계와 스킬 조합</span>
        <span className="text-muted-foreground text-xs tabular-nums">
          {steps.length}단계 · 스킬 {skills.length}개
        </span>
      </figcaption>

      {/* 넓은 화면: 스킬마다 처음 쓰는 단계부터 마지막 단계까지 선으로 잇는다 */}
      <div
        className="hidden gap-x-2 gap-y-3 md:grid"
        style={{
          gridTemplateColumns: `minmax(10rem, 13rem) repeat(${steps.length}, minmax(0, 1fr))`,
        }}
      >
        <span />
        {steps.map((step, index) => (
          <div
            key={step.title}
            className="flex min-w-0 flex-col items-center gap-1.5 pb-2 text-center"
            title={step.detail}
          >
            <span className="bg-foreground text-background inline-grid size-6 place-items-center rounded-full text-xs font-semibold tabular-nums">
              {index + 1}
            </span>
            <p className="text-sm leading-snug font-medium break-keep">{step.title}</p>
          </div>
        ))}
        {skills.map((id, row) => {
          const used = steps.flatMap((step, index) => (step.skills.includes(id) ? [index] : []));
          const first = used[0];
          const last = used[used.length - 1];
          const span = last - first + 1;
          const gridRow = row + 2;
          return (
            <div key={id} className="contents" style={tone(toolkitOf(id).tone)}>
              <div
                className="text-muted-foreground flex min-w-0 items-center"
                style={{ gridRow, gridColumn: 1 }}
              >
                <SkillName id={id} />
              </div>
              {span > 1 && (
                <span
                  aria-hidden
                  className="h-0.5 self-center rounded-full bg-[color-mix(in_oklab,var(--tone)_45%,transparent)]"
                  style={{
                    gridRow,
                    gridColumn: `${first + 2} / ${last + 3}`,
                    marginInline: `calc(100% / ${span * 2})`,
                  }}
                />
              )}
              {used.map((index) => (
                <span
                  key={index}
                  aria-hidden
                  className="ring-card size-3 place-self-center rounded-full bg-[var(--tone)] ring-4"
                  style={{ gridRow, gridColumn: index + 2 }}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* 휴대폰: 단계별로 쓰는 스킬 */}
      <ol className="space-y-4 md:hidden">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span className="bg-foreground text-background grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums">
              {index + 1}
            </span>
            <div className="min-w-0 space-y-2">
              <p className="text-sm font-medium">{step.title}</p>
              <ul className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1.5">
                {step.skills.map((id) => (
                  <li key={id} style={tone(toolkitOf(id).tone)} className="min-w-0">
                    <SkillName id={id} />
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>

      <ul className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1.5 border-t pt-4 text-xs">
        {toolkits.map((toolkit) => (
          <li key={toolkit.id} className="flex items-center gap-1.5" style={tone(toolkit.tone)}>
            <span className="size-2 rounded-full bg-[var(--tone)]" />
            {toolkit.label}
          </li>
        ))}
      </ul>
    </figure>
  );
}
