import { site } from "@/lib/site";

/** The line that says who made the site, linked to the maker's GitHub. */
export function SiteCredit() {
  const { credit } = site;

  return (
    <>
      {credit.lead}{" "}
      <a href={credit.href} className="text-link">
        {credit.name}
      </a>
    </>
  );
}
