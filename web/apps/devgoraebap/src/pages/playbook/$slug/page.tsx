import { Link, createFileRoute } from "@tanstack/react-router";
import { buttonVariants } from "@goraebap/ui-react/components/button";
import { PLAYBOOKS, PlaybookRecipe } from "@/entities/playbook";
import { DocArticle } from "@/entities/webapp-doc";
import { PageState } from "@/shared/ui";
import { CodeExampleList, examplesFor, pageSkills } from "@/entities/code-example";

export const Route = createFileRoute("/playbook/$slug/")({
  component: PlaybookPage,
});

const toLink = (playbook?: (typeof PLAYBOOKS)[number]) =>
  playbook ? { title: playbook.title, href: `/playbook/${playbook.slug}` } : undefined;

function PlaybookPage() {
  const { slug } = Route.useParams();
  const index = PLAYBOOKS.findIndex((playbook) => playbook.slug === slug);
  const playbook = PLAYBOOKS[index];

  if (!playbook) {
    return (
      <PageState
        kind="not-found"
        title="플레이북을 찾을 수 없습니다"
        action={
          <Link to="/playbook" className={buttonVariants({ variant: "outline", size: "sm" })}>
            플레이북 목록으로 돌아가기
          </Link>
        }
      />
    );
  }

  return (
    <DocArticle
      doc={{ ...playbook, group: playbook.phase }}
      lead={<PlaybookRecipe playbook={playbook} />}
      trailing={
        <CodeExampleList examples={examplesFor(pageSkills(`/playbook/${playbook.slug}`))} />
      }
      prevDoc={toLink(PLAYBOOKS[index - 1])}
      nextDoc={toLink(PLAYBOOKS[index + 1])}
    />
  );
}
